const express = require("express");
const router = express.Router();
const { runQuery, getRow, getAll } = require("../database/enhanced_schema");
const { authenticateToken } = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

// Get user's savings accounts
router.get("/my-accounts", authenticateToken, async (req, res) => {
  try {
    const accounts = await getAll(
      `SELECT a.*, at.name as account_type_name, at.code as account_type_code,
              g.name as group_name
       FROM accounts a
       JOIN account_types at ON a.account_type_id = at.id
       LEFT JOIN groups g ON a.group_id = g.id
       WHERE a.user_id = ? AND a.status = 'active'
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    res.json(accounts);
  } catch (error) {
    console.error("Error fetching savings accounts:", error);
    res.status(500).json({ message: "Error fetching savings accounts" });
  }
});

// Get savings account balance
router.get("/balance", authenticateToken, async (req, res) => {
  try {
    const accounts = await getAll(
      "SELECT SUM(balance) as total_balance FROM accounts WHERE user_id = ? AND status = 'active'",
      [req.user.id]
    );

    const totalBalance = accounts[0]?.total_balance || 0;

    res.json({ balance: totalBalance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ message: "Error fetching balance" });
  }
});

// Make deposit
router.post("/deposit", authenticateToken, async (req, res) => {
  try {
    const {
      account_id,
      amount,
      payment_method,
      payment_reference,
      description,
    } = req.body;

    // Validate account
    const account = await getRow(
      "SELECT * FROM accounts WHERE id = ? AND user_id = ? AND status = 'active'",
      [account_id, req.user.id]
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Check daily/monthly limits
    if (account.daily_limit) {
      const todayDeposits = await getRow(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM transactions 
         WHERE account_id = ? AND type = 'deposit' 
         AND DATE(created_at) = DATE('now')`,
        [account_id]
      );

      if (todayDeposits.total + amount > account.daily_limit) {
        return res.status(400).json({
          message: "Daily deposit limit exceeded",
        });
      }
    }

    if (account.monthly_limit) {
      const monthDeposits = await getRow(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM transactions 
         WHERE account_id = ? AND type = 'deposit' 
         AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
        [account_id]
      );

      if (monthDeposits.total + amount > account.monthly_limit) {
        return res.status(400).json({
          message: "Monthly deposit limit exceeded",
        });
      }
    }

    // Generate transaction number
    const transactionNumber = `TXN${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;

    // Create transaction
    await runQuery(
      `INSERT INTO transactions (
        transaction_number, account_id, user_id, type, amount,
        balance_before, balance_after, description, payment_method,
        payment_reference, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionNumber,
        account_id,
        req.user.id,
        "deposit",
        amount,
        account.balance,
        account.balance + amount,
        description || "Deposit",
        payment_method,
        payment_reference,
        req.user.id,
      ]
    );

    // Update account balance
    await runQuery(
      "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [amount, account_id]
    );

    // Send notifications if enabled
    if (account.sms_notifications) {
      // TODO: Implement SMS notification
      console.log(
        `SMS: Deposit of ${amount} received in account ${account.account_number}`
      );
    }

    if (account.email_notifications) {
      // TODO: Implement email notification
      console.log(
        `Email: Deposit of ${amount} received in account ${account.account_number}`
      );
    }

    res.json({
      message: "Deposit successful",
      transaction_number: transactionNumber,
      new_balance: account.balance + amount,
    });
  } catch (error) {
    console.error("Error making deposit:", error);
    res.status(500).json({ message: "Error making deposit" });
  }
});

// Make withdrawal
router.post("/withdraw", authenticateToken, async (req, res) => {
  try {
    const { account_id, amount, description } = req.body;

    // Validate account
    const account = await getRow(
      "SELECT * FROM accounts WHERE id = ? AND user_id = ? AND status = 'active'",
      [account_id, req.user.id]
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (account.balance - amount < account.minimum_balance) {
      return res.status(400).json({
        message: "Withdrawal would violate minimum balance requirement",
      });
    }

    // Generate transaction number
    const transactionNumber = `TXN${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;

    // Create transaction
    await runQuery(
      `INSERT INTO transactions (
        transaction_number, account_id, user_id, type, amount,
        balance_before, balance_after, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionNumber,
        account_id,
        req.user.id,
        "withdrawal",
        amount,
        account.balance,
        account.balance - amount,
        description || "Withdrawal",
        req.user.id,
      ]
    );

    // Update account balance
    await runQuery(
      "UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [amount, account_id]
    );

    res.json({
      message: "Withdrawal successful",
      transaction_number: transactionNumber,
      new_balance: account.balance - amount,
    });
  } catch (error) {
    console.error("Error making withdrawal:", error);
    res.status(500).json({ message: "Error making withdrawal" });
  }
});

// Create fixed deposit
router.post("/fixed-deposits", authenticateToken, async (req, res) => {
  try {
    const {
      account_id,
      amount,
      term_months,
      interest_rate,
      auto_renewal = false,
      renewal_term_months,
    } = req.body;

    // Validate account
    const account = await getRow(
      "SELECT * FROM accounts WHERE id = ? AND user_id = ? AND status = 'active'",
      [account_id, req.user.id]
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (term_months < 1 || term_months > 60) {
      return res
        .status(400)
        .json({ message: "Term must be between 1 and 60 months" });
    }

    // Calculate dates
    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + term_months);

    // Generate deposit number
    const depositNumber = `FD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Calculate interest and total amount
    const interestAmount = (amount * interest_rate * term_months) / (12 * 100);
    const totalAmount = amount + interestAmount;

    // Create fixed deposit
    const result = await runQuery(
      `INSERT INTO fixed_deposits (
        account_id, deposit_number, amount, interest_rate, term_months,
        start_date, maturity_date, interest_amount, total_amount,
        auto_renewal, renewal_term_months
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account_id,
        depositNumber,
        amount,
        interest_rate,
        term_months,
        startDate.toISOString().split("T")[0],
        maturityDate.toISOString().split("T")[0],
        interestAmount,
        totalAmount,
        auto_renewal,
        renewal_term_months,
      ]
    );

    // Block the amount in the account
    await runQuery(
      "UPDATE accounts SET blocked_amount = blocked_amount + ? WHERE id = ?",
      [amount, account_id]
    );

    // Create transaction record
    const transactionNumber = `TXN${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;
    await runQuery(
      `INSERT INTO transactions (
        transaction_number, account_id, user_id, type, amount,
        balance_before, balance_after, description, reference_id,
        reference_type, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionNumber,
        account_id,
        req.user.id,
        "investment_purchase",
        amount,
        account.balance,
        account.balance,
        `Fixed deposit created - ${depositNumber}`,
        result.id,
        "fixed_deposit",
        req.user.id,
      ]
    );

    res.status(201).json({
      message: "Fixed deposit created successfully",
      deposit_number: depositNumber,
      deposit_id: result.id,
    });
  } catch (error) {
    console.error("Error creating fixed deposit:", error);
    res.status(500).json({ message: "Error creating fixed deposit" });
  }
});

// Get user's fixed deposits
router.get("/fixed-deposits", authenticateToken, async (req, res) => {
  try {
    const deposits = await getAll(
      `SELECT fd.*, a.account_number, a.account_name
       FROM fixed_deposits fd
       JOIN accounts a ON fd.account_id = a.id
       WHERE a.user_id = ?
       ORDER BY fd.created_at DESC`,
      [req.user.id]
    );

    res.json(deposits);
  } catch (error) {
    console.error("Error fetching fixed deposits:", error);
    res.status(500).json({ message: "Error fetching fixed deposits" });
  }
});

// Withdraw fixed deposit early
router.post("/fixed-deposits/:id/withdraw", authenticateToken, async (req, res) => {
  try {
    const deposit = await getRow(
      `SELECT fd.*, a.user_id, a.account_number, a.balance, a.blocked_amount
       FROM fixed_deposits fd
       JOIN accounts a ON fd.account_id = a.id
       WHERE fd.id = ? AND a.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!deposit) {
      return res.status(404).json({ message: "Fixed deposit not found" });
    }

    if (deposit.status !== "active") {
      return res.status(400).json({ message: "Fixed deposit is not active" });
    }

    // Calculate early withdrawal penalty
    const daysToMaturity = Math.ceil(
      (new Date(deposit.maturity_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    const penaltyRate = deposit.early_withdrawal_penalty || 2.0; // Default 2%
    const penaltyAmount = (deposit.amount * penaltyRate) / 100;
    const withdrawalAmount = deposit.amount - penaltyAmount;

    // Update fixed deposit status
    await runQuery(
      `UPDATE fixed_deposits SET 
       status = 'withdrawn', 
       withdrawn_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );

    // Unblock amount and add withdrawal amount to account
    await runQuery(
      `UPDATE accounts SET 
       blocked_amount = blocked_amount - ?, 
       balance = balance + ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [deposit.amount, withdrawalAmount, deposit.account_id]
    );

    // Create transaction records
    const transactionNumber = `TXN${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;
    await runQuery(
      `INSERT INTO transactions (
        transaction_number, account_id, user_id, type, amount,
        balance_before, balance_after, description, reference_id,
        reference_type, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionNumber,
        deposit.account_id,
        req.user.id,
        "investment_sale",
        withdrawalAmount,
        deposit.balance,
        deposit.balance + withdrawalAmount,
        `Early withdrawal from fixed deposit ${deposit.deposit_number} (Penalty: ${penaltyAmount})`,
        deposit.id,
        "fixed_deposit",
        req.user.id,
      ]
    );

    res.json({
      message: "Fixed deposit withdrawn successfully",
      withdrawal_amount: withdrawalAmount,
      penalty_amount: penaltyAmount,
      transaction_number: transactionNumber,
    });
  } catch (error) {
    console.error("Error withdrawing fixed deposit:", error);
    res.status(500).json({ message: "Error withdrawing fixed deposit" });
  }
});

// Create target savings
router.post("/target-savings", authenticateToken, async (req, res) => {
  try {
    const {
      account_id,
      target_name,
      target_amount,
      target_date,
      frequency = "monthly",
      contribution_amount,
    } = req.body;

    // Validate account
    const account = await getRow(
      "SELECT * FROM accounts WHERE id = ? AND user_id = ? AND status = 'active'",
      [account_id, req.user.id]
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (target_amount <= 0) {
      return res.status(400).json({ message: "Invalid target amount" });
    }

    // Create target savings
    const result = await runQuery(
      `INSERT INTO target_savings (
        account_id, target_name, target_amount, target_date,
        frequency, contribution_amount
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        account_id,
        target_name,
        target_amount,
        target_date,
        frequency,
        contribution_amount,
      ]
    );

    res.status(201).json({
      message: "Target savings created successfully",
      target_id: result.id,
    });
  } catch (error) {
    console.error("Error creating target savings:", error);
    res.status(500).json({ message: "Error creating target savings" });
  }
});

// Get user's target savings
router.get("/target-savings", authenticateToken, async (req, res) => {
  try {
    const targets = await getAll(
      `SELECT ts.*, a.account_number, a.account_name
       FROM target_savings ts
       JOIN accounts a ON ts.account_id = a.id
       WHERE a.user_id = ?
       ORDER BY ts.created_at DESC`,
      [req.user.id]
    );

    res.json(targets);
  } catch (error) {
    console.error("Error fetching target savings:", error);
    res.status(500).json({ message: "Error fetching target savings" });
  }
});

// Contribute to target savings
router.post("/target-savings/:id/contribute", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    const target = await getRow(
      `SELECT ts.*, a.user_id, a.balance, a.account_number
       FROM target_savings ts
       JOIN accounts a ON ts.account_id = a.id
       WHERE ts.id = ? AND a.user_id = ? AND ts.status = 'active'`,
      [req.params.id, req.user.id]
    );

    if (!target) {
      return res.status(404).json({ message: "Target savings not found" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (target.current_amount + amount > target.target_amount) {
      return res.status(400).json({
        message: "Contribution would exceed target amount",
      });
    }

    // Update target savings
    const newAmount = target.current_amount + amount;
    const isCompleted = newAmount >= target.target_amount;

    await runQuery(
      `UPDATE target_savings SET 
       current_amount = ?, 
       status = ?,
       completed_at = ?
       WHERE id = ?`,
      [
        newAmount,
        isCompleted ? "completed" : "active",
        isCompleted ? new Date() : null,
        req.params.id,
      ]
    );

    // Create transaction
    const transactionNumber = `TXN${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;
    await runQuery(
      `INSERT INTO transactions (
        transaction_number, account_id, user_id, type, amount,
        balance_before, balance_after, description, reference_id,
        reference_type, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionNumber,
        target.account_id,
        req.user.id,
        "deposit",
        amount,
        target.balance,
        target.balance + amount,
        `Contribution to target: ${target.target_name}`,
        req.params.id,
        "target_savings",
        req.user.id,
      ]
    );

    // Update account balance
    await runQuery(
      "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [amount, target.account_id]
    );

    res.json({
      message: "Contribution successful",
      new_amount: newAmount,
      is_completed: isCompleted,
      transaction_number: transactionNumber,
    });
  } catch (error) {
    console.error("Error contributing to target savings:", error);
    res.status(500).json({ message: "Error contributing to target savings" });
  }
});

// Get savings statistics
router.get("/statistics", authenticateToken, async (req, res) => {
  try {
    // Total balance
    const totalBalance = await getRow(
      "SELECT SUM(balance) as total FROM accounts WHERE user_id = ? AND status = 'active'",
      [req.user.id]
    );

    // Fixed deposits
    const fixedDeposits = await getRow(
      `SELECT COUNT(*) as count, SUM(amount) as total_amount
       FROM fixed_deposits fd
       JOIN accounts a ON fd.account_id = a.id
       WHERE a.user_id = ? AND fd.status = 'active'`,
      [req.user.id]
    );

    // Target savings
    const targetSavings = await getRow(
      `SELECT COUNT(*) as count, SUM(target_amount) as total_target
       FROM target_savings ts
       JOIN accounts a ON ts.account_id = a.id
       WHERE a.user_id = ? AND ts.status = 'active'`,
      [req.user.id]
    );

    // Monthly deposits
    const monthlyDeposits = await getRow(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE a.user_id = ? AND t.type = 'deposit'
       AND strftime('%Y-%m', t.created_at) = strftime('%Y-%m', 'now')`,
      [req.user.id]
    );

    res.json({
      total_balance: totalBalance.total || 0,
      fixed_deposits: {
        count: fixedDeposits.count || 0,
        total_amount: fixedDeposits.total_amount || 0,
      },
      target_savings: {
        count: targetSavings.count || 0,
        total_target: targetSavings.total_target || 0,
      },
      monthly_deposits: monthlyDeposits.total || 0,
    });
  } catch (error) {
    console.error("Error fetching savings statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
});

module.exports = router;
