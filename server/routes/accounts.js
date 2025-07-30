const express = require("express");
const router = express.Router();
const { runQuery, getRow, getAll } = require("../database/enhanced_schema");
const { authenticateToken } = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

// Generate unique account number
const generateAccountNumber = async () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `CH${timestamp}${random}`;
};

// Generate virtual account number
const generateVirtualAccountNumber = async () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `VA${timestamp}${random}`;
};

// Get all account types
router.get("/types", authenticateToken, async (req, res) => {
  try {
    const accountTypes = await getAll(
      "SELECT * FROM account_types WHERE status = 'active' ORDER BY name"
    );
    res.json(accountTypes);
  } catch (error) {
    console.error("Error fetching account types:", error);
    res.status(500).json({ message: "Error fetching account types" });
  }
});

// Get account type by ID
router.get("/types/:id", authenticateToken, async (req, res) => {
  try {
    const accountType = await getRow(
      "SELECT * FROM account_types WHERE id = ? AND status = 'active'",
      [req.params.id]
    );

    if (!accountType) {
      return res.status(404).json({ message: "Account type not found" });
    }

    res.json(accountType);
  } catch (error) {
    console.error("Error fetching account type:", error);
    res.status(500).json({ message: "Error fetching account type" });
  }
});

// Create new account
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const {
      account_type_id,
      account_name,
      group_id,
      joint_members,
      currency = "KES",
    } = req.body;

    // Validate account type
    const accountType = await getRow(
      "SELECT * FROM account_types WHERE id = ? AND status = 'active'",
      [account_type_id]
    );

    if (!accountType) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    // Check if user already has this type of account
    const existingAccount = await getRow(
      "SELECT id FROM accounts WHERE user_id = ? AND account_type_id = ? AND status != 'closed'",
      [req.user.id, account_type_id]
    );

    if (existingAccount && !accountType.allows_group_accounts) {
      return res.status(400).json({
        message: "You already have an account of this type",
      });
    }

    // Check KYC requirement
    if (accountType.requires_kyc && req.user.kyc_status !== "verified") {
      return res.status(400).json({
        message: "KYC verification required for this account type",
      });
    }

    // Generate account numbers
    const accountNumber = await generateAccountNumber();
    const virtualAccountNumber = await generateVirtualAccountNumber();

    // Create account
    const result = await runQuery(
      `INSERT INTO accounts (
        account_number, virtual_account_number, account_type_id, user_id, 
        group_id, account_name, interest_rate, minimum_balance, 
        currency, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        accountNumber,
        virtualAccountNumber,
        account_type_id,
        req.user.id,
        group_id || null,
        account_name,
        accountType.interest_rate,
        accountType.min_balance,
        currency,
        req.user.id,
        accountType.requires_approval ? "pending" : "active",
      ]
    );

    const accountId = result.id;

    // Add joint members if applicable
    if (
      joint_members &&
      joint_members.length > 0 &&
      accountType.allows_joint_accounts
    ) {
      for (const member of joint_members) {
        await runQuery(
          `INSERT INTO joint_account_members (
            account_id, user_id, role, permissions
          ) VALUES (?, ?, ?, ?)`,
          [
            accountId,
            member.user_id,
            member.role || "member",
            member.permissions,
          ]
        );
      }
    }

    // Get created account with details
    const newAccount = await getRow(
      `SELECT a.*, at.name as account_type_name, at.code as account_type_code
       FROM accounts a
       JOIN account_types at ON a.account_type_id = at.id
       WHERE a.id = ?`,
      [accountId]
    );

    res.status(201).json({
      message: "Account created successfully",
      account: newAccount,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ message: "Error creating account" });
  }
});

// Get user's accounts
router.get("/my-accounts", authenticateToken, async (req, res) => {
  try {
    const accounts = await getAll(
      `SELECT a.*, at.name as account_type_name, at.code as account_type_code,
              g.name as group_name
       FROM accounts a
       JOIN account_types at ON a.account_type_id = at.id
       LEFT JOIN groups g ON a.group_id = g.id
       WHERE a.user_id = ? AND a.status != 'closed'
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    res.json(accounts);
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    res.status(500).json({ message: "Error fetching accounts" });
  }
});

// Get account details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const account = await getRow(
      `SELECT a.*, at.name as account_type_name, at.code as account_type_code,
              g.name as group_name, u.first_name, u.last_name, u.email
       FROM accounts a
       JOIN account_types at ON a.account_type_id = at.id
       LEFT JOIN groups g ON a.group_id = g.id
       JOIN users u ON a.user_id = u.id
       WHERE a.id = ? AND a.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Get joint members if any
    const jointMembers = await getAll(
      `SELECT jam.*, u.first_name, u.last_name, u.email
       FROM joint_account_members jam
       JOIN users u ON jam.user_id = u.id
       WHERE jam.account_id = ?`,
      [req.params.id]
    );

    // Get recent transactions
    const recentTransactions = await getAll(
      `SELECT * FROM transactions 
       WHERE account_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [req.params.id]
    );

    res.json({
      account,
      jointMembers,
      recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching account details:", error);
    res.status(500).json({ message: "Error fetching account details" });
  }
});

// Update account settings
router.put("/:id/settings", authenticateToken, async (req, res) => {
  try {
    const {
      sms_notifications,
      email_notifications,
      daily_limit,
      monthly_limit,
    } = req.body;

    const account = await getRow(
      "SELECT id FROM accounts WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    await runQuery(
      `UPDATE accounts SET 
       sms_notifications = ?, 
       email_notifications = ?,
       daily_limit = ?,
       monthly_limit = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        sms_notifications,
        email_notifications,
        daily_limit,
        monthly_limit,
        req.params.id,
      ]
    );

    res.json({ message: "Account settings updated successfully" });
  } catch (error) {
    console.error("Error updating account settings:", error);
    res.status(500).json({ message: "Error updating account settings" });
  }
});

// Close account
router.put("/:id/close", authenticateToken, async (req, res) => {
  try {
    const account = await getRow(
      "SELECT * FROM accounts WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.status === "closed") {
      return res.status(400).json({ message: "Account is already closed" });
    }

    if (account.balance > 0) {
      return res.status(400).json({
        message: "Cannot close account with remaining balance",
      });
    }

    await runQuery(
      `UPDATE accounts SET 
       status = 'closed', 
       closed_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: "Account closed successfully" });
  } catch (error) {
    console.error("Error closing account:", error);
    res.status(500).json({ message: "Error closing account" });
  }
});

// Get account statement
router.get("/:id/statement", authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, page = 1, limit = 20 } = req.query;

    const account = await getRow(
      "SELECT id FROM accounts WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    let whereClause = "WHERE account_id = ?";
    let params = [req.params.id];

    if (start_date && end_date) {
      whereClause += " AND DATE(created_at) BETWEEN ? AND ?";
      params.push(start_date, end_date);
    }

    const offset = (page - 1) * limit;

    const transactions = await getAll(
      `SELECT * FROM transactions 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalCount = await getRow(
      `SELECT COUNT(*) as count FROM transactions ${whereClause}`,
      params
    );

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching account statement:", error);
    res.status(500).json({ message: "Error fetching account statement" });
  }
});

// Admin: Get all accounts (for admin panel)
router.get("/admin/all", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status, account_type_id, page = 1, limit = 20 } = req.query;

    let whereClause = "WHERE 1=1";
    let params = [];

    if (status) {
      whereClause += " AND a.status = ?";
      params.push(status);
    }

    if (account_type_id) {
      whereClause += " AND a.account_type_id = ?";
      params.push(account_type_id);
    }

    const offset = (page - 1) * limit;

    const accounts = await getAll(
      `SELECT a.*, at.name as account_type_name, u.first_name, u.last_name, u.email,
              g.name as group_name
       FROM accounts a
       JOIN account_types at ON a.account_type_id = at.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN groups g ON a.group_id = g.id
       ${whereClause}
       ORDER BY a.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalCount = await getRow(
      `SELECT COUNT(*) as count FROM accounts a ${whereClause}`,
      params
    );

    res.json({
      accounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all accounts:", error);
    res.status(500).json({ message: "Error fetching accounts" });
  }
});

// Admin: Approve account
router.put("/admin/:id/approve", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const account = await getRow(
      "SELECT * FROM accounts WHERE id = ? AND status = 'pending'",
      [req.params.id]
    );

    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found or already approved" });
    }

    await runQuery(
      `UPDATE accounts SET 
       status = 'active', 
       approved_by = ?,
       approved_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user.id, req.params.id]
    );

    res.json({ message: "Account approved successfully" });
  } catch (error) {
    console.error("Error approving account:", error);
    res.status(500).json({ message: "Error approving account" });
  }
});

// Admin: Reject account
router.put("/admin/:id/reject", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { reason } = req.body;

    const account = await getRow(
      "SELECT * FROM accounts WHERE id = ? AND status = 'pending'",
      [req.params.id]
    );

    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found or already processed" });
    }

    await runQuery(
      `UPDATE accounts SET 
       status = 'closed', 
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: "Account rejected successfully" });
  } catch (error) {
    console.error("Error rejecting account:", error);
    res.status(500).json({ message: "Error rejecting account" });
  }
});

module.exports = router;
