const express = require("express");
const router = express.Router();
const { runQuery, getRow, getAll } = require("../database/enhanced_schema");
const { authenticateToken } = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

// Generate unique investment number
const generateInvestmentNumber = async () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `INV${timestamp}${random}`;
};

// Get available investment products
router.get("/products", authenticateToken, async (req, res) => {
  try {
    const products = [
      {
        id: 1,
        name: "Government Bonds",
        type: "bonds",
        bond_type: "government",
        issuer: "Government of Kenya",
        face_value: 100000,
        coupon_rate: 12.5,
        maturity_date: "2025-12-31",
        risk_profile: "low",
        min_investment: 50000,
        description: "Secure government bonds with guaranteed returns",
      },
      {
        id: 2,
        name: "Corporate Bonds",
        type: "bonds",
        bond_type: "corporate",
        issuer: "Safaricom PLC",
        face_value: 50000,
        coupon_rate: 15.0,
        maturity_date: "2024-06-30",
        risk_profile: "medium",
        min_investment: 25000,
        description: "Corporate bonds with higher returns",
      },
      {
        id: 3,
        name: "Fixed Deposit",
        type: "fixed_deposit",
        interest_rate: 8.5,
        term_months: 12,
        risk_profile: "low",
        min_investment: 10000,
        description: "Fixed term deposit with guaranteed returns",
      },
      {
        id: 4,
        name: "Money Market Fund",
        type: "mutual_funds",
        interest_rate: 7.2,
        risk_profile: "low",
        min_investment: 5000,
        description: "Liquid money market investment",
      },
    ];

    res.json(products);
  } catch (error) {
    console.error("Error fetching investment products:", error);
    res.status(500).json({ message: "Error fetching investment products" });
  }
});

// Purchase investment
router.post("/purchase", authenticateToken, async (req, res) => {
  try {
    const {
      investment_type,
      amount,
      product_id,
      bond_type,
      issuer,
      face_value,
      coupon_rate,
      maturity_date,
      interest_rate,
      term_months,
    } = req.body;

    // Validate investment type
    const validTypes = ["bonds", "stocks", "mutual_funds", "fixed_deposit"];
    if (!validTypes.includes(investment_type)) {
      return res.status(400).json({ message: "Invalid investment type" });
    }

    // Check user's account balance
    const account = await getRow(
      "SELECT * FROM accounts WHERE user_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1",
      [req.user.id]
    );

    if (!account) {
      return res.status(400).json({ message: "No active account found" });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Generate investment number
    const investmentNumber = await generateInvestmentNumber();

    // Calculate maturity date for fixed deposits
    let calculatedMaturityDate = null;
    if (investment_type === "fixed_deposit" && term_months) {
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + term_months);
      calculatedMaturityDate = maturityDate.toISOString().split("T")[0];
    }

    // Create investment record
    const result = await runQuery(
      `INSERT INTO investments (
        user_id, investment_number, investment_type, amount,
        interest_rate, term_months, start_date, maturity_date,
        current_value, risk_profile
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        investmentNumber,
        investment_type,
        amount,
        interest_rate || 0,
        term_months || null,
        new Date().toISOString().split("T")[0],
        calculatedMaturityDate || maturity_date,
        amount,
        "low", // Default risk profile
      ]
    );

    const investmentId = result.id;

    // Create bond record if applicable
    if (investment_type === "bonds" && bond_type && issuer) {
      await runQuery(
        `INSERT INTO bonds (
          investment_id, bond_type, issuer, face_value,
          coupon_rate, maturity_date, purchase_price,
          current_price, yield_to_maturity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          investmentId,
          bond_type,
          issuer,
          face_value,
          coupon_rate,
          maturity_date,
          amount,
          amount,
          coupon_rate,
        ]
      );
    }

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
        account.id,
        req.user.id,
        "investment_purchase",
        amount,
        account.balance,
        account.balance - amount,
        `Investment purchase - ${investmentNumber}`,
        investmentId,
        "investment",
        req.user.id,
      ]
    );

    // Update account balance
    await runQuery(
      "UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [amount, account.id]
    );

    res.status(201).json({
      message: "Investment purchased successfully",
      investment_number: investmentNumber,
      investment_id: investmentId,
      transaction_number: transactionNumber,
    });
  } catch (error) {
    console.error("Error purchasing investment:", error);
    res.status(500).json({ message: "Error purchasing investment" });
  }
});

// Get user's investments
router.get("/my-investments", authenticateToken, async (req, res) => {
  try {
    const investments = await getAll(
      `SELECT i.*, b.bond_type, b.issuer, b.face_value, b.coupon_rate, b.maturity_date
       FROM investments i
       LEFT JOIN bonds b ON i.id = b.investment_id
       WHERE i.user_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );

    res.json(investments);
  } catch (error) {
    console.error("Error fetching investments:", error);
    res.status(500).json({ message: "Error fetching investments" });
  }
});

// Get investment details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const investment = await getRow(
      `SELECT i.*, b.bond_type, b.issuer, b.face_value, b.coupon_rate, b.maturity_date,
              b.purchase_price, b.current_price, b.yield_to_maturity
       FROM investments i
       LEFT JOIN bonds b ON i.id = b.investment_id
       WHERE i.id = ? AND i.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!investment) {
      return res.status(404).json({ message: "Investment not found" });
    }

    res.json(investment);
  } catch (error) {
    console.error("Error fetching investment details:", error);
    res.status(500).json({ message: "Error fetching investment details" });
  }
});

// Sell investment
router.post("/:id/sell", authenticateToken, async (req, res) => {
  try {
    const { amount, sell_price } = req.body;

    const investment = await getRow(
      "SELECT * FROM investments WHERE id = ? AND user_id = ? AND status = 'active'",
      [req.params.id, req.user.id]
    );

    if (!investment) {
      return res.status(404).json({ message: "Investment not found" });
    }

    if (investment.investment_type === "fixed_deposit") {
      return res
        .status(400)
        .json({ message: "Fixed deposits cannot be sold early" });
    }

    // Get user's account
    const account = await getRow(
      "SELECT * FROM accounts WHERE user_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1",
      [req.user.id]
    );

    if (!account) {
      return res.status(400).json({ message: "No active account found" });
    }

    // Calculate profit/loss
    const profitLoss = sell_price - investment.amount;
    const profitLossPercentage = (profitLoss / investment.amount) * 100;

    // Update investment status
    await runQuery(
      `UPDATE investments SET 
       status = 'sold', 
       current_value = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [sell_price, req.params.id]
    );

    // Update bond status if applicable
    if (investment.investment_type === "bonds") {
      await runQuery(
        `UPDATE bonds SET 
         status = 'sold', 
         current_price = ?
         WHERE investment_id = ?`,
        [sell_price, req.params.id]
      );
    }

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
        account.id,
        req.user.id,
        "investment_sale",
        sell_price,
        account.balance,
        account.balance + sell_price,
        `Investment sale - ${investment.investment_number} (P/L: ${profitLoss})`,
        req.params.id,
        "investment",
        req.user.id,
      ]
    );

    // Update account balance
    await runQuery(
      "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [sell_price, account.id]
    );

    res.json({
      message: "Investment sold successfully",
      transaction_number: transactionNumber,
      profit_loss: profitLoss,
      profit_loss_percentage: profitLossPercentage,
      new_balance: account.balance + sell_price,
    });
  } catch (error) {
    console.error("Error selling investment:", error);
    res.status(500).json({ message: "Error selling investment" });
  }
});

// Get investment portfolio
router.get("/portfolio", authenticateToken, async (req, res) => {
  try {
    // Get all investments
    const investments = await getAll(
      `SELECT i.*, b.bond_type, b.issuer, b.face_value, b.coupon_rate
       FROM investments i
       LEFT JOIN bonds b ON i.id = b.investment_id
       WHERE i.user_id = ? AND i.status = 'active'
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );

    // Calculate portfolio statistics
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const currentValue = investments.reduce(
      (sum, inv) => sum + inv.current_value,
      0
    );
    const totalProfitLoss = currentValue - totalInvested;
    const profitLossPercentage =
      totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    // Group by investment type
    const byType = investments.reduce((acc, inv) => {
      if (!acc[inv.investment_type]) {
        acc[inv.investment_type] = [];
      }
      acc[inv.investment_type].push(inv);
      return acc;
    }, {});

    // Calculate type-wise statistics
    const typeStats = Object.keys(byType).map((type) => {
      const typeInvestments = byType[type];
      const typeTotal = typeInvestments.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );
      const typeCurrent = typeInvestments.reduce(
        (sum, inv) => sum + inv.current_value,
        0
      );
      const typePL = typeCurrent - typeTotal;
      const typePLPercentage = typeTotal > 0 ? (typePL / typeTotal) * 100 : 0;

      return {
        type,
        count: typeInvestments.length,
        total_invested: typeTotal,
        current_value: typeCurrent,
        profit_loss: typePL,
        profit_loss_percentage: typePLPercentage,
      };
    });

    res.json({
      investments,
      portfolio_summary: {
        total_invested: totalInvested,
        current_value: currentValue,
        total_profit_loss: totalProfitLoss,
        profit_loss_percentage: profitLossPercentage,
        total_investments: investments.length,
      },
      by_type: typeStats,
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ message: "Error fetching portfolio" });
  }
});

// Get investment performance
router.get("/performance", authenticateToken, async (req, res) => {
  try {
    const { period = "1y" } = req.query;

    // Get investments with performance data
    const investments = await getAll(
      `SELECT i.*, b.bond_type, b.issuer, b.coupon_rate
       FROM investments i
       LEFT JOIN bonds b ON i.id = b.investment_id
       WHERE i.user_id = ? AND i.status = 'active'
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );

    // Calculate performance metrics
    const performance = investments.map((inv) => {
      const daysHeld = Math.ceil(
        (new Date() - new Date(inv.start_date)) / (1000 * 60 * 60 * 24)
      );
      const annualizedReturn =
        daysHeld > 0
          ? ((inv.current_value - inv.amount) / inv.amount) *
            (365 / daysHeld) *
            100
          : 0;

      return {
        investment_number: inv.investment_number,
        investment_type: inv.investment_type,
        amount: inv.amount,
        current_value: inv.current_value,
        profit_loss: inv.current_value - inv.amount,
        profit_loss_percentage:
          ((inv.current_value - inv.amount) / inv.amount) * 100,
        days_held: daysHeld,
        annualized_return: annualizedReturn,
        bond_type: inv.bond_type,
        issuer: inv.issuer,
        coupon_rate: inv.coupon_rate,
      };
    });

    // Calculate overall performance
    const totalInvested = performance.reduce((sum, p) => sum + p.amount, 0);
    const totalCurrent = performance.reduce(
      (sum, p) => sum + p.current_value,
      0
    );
    const totalPL = totalCurrent - totalInvested;
    const totalPLPercentage =
      totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    res.json({
      performance,
      summary: {
        total_invested: totalInvested,
        current_value: totalCurrent,
        total_profit_loss: totalPL,
        total_profit_loss_percentage: totalPLPercentage,
        average_return:
          performance.length > 0
            ? performance.reduce(
                (sum, p) => sum + p.profit_loss_percentage,
                0
              ) / performance.length
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({ message: "Error fetching performance" });
  }
});

// Get bond market data (simulated)
router.get("/bonds/market", authenticateToken, async (req, res) => {
  try {
    const marketData = [
      {
        bond_type: "government",
        issuer: "Government of Kenya",
        face_value: 100000,
        coupon_rate: 12.5,
        maturity_date: "2025-12-31",
        current_price: 102500,
        yield_to_maturity: 11.8,
        risk_rating: "AAA",
      },
      {
        bond_type: "corporate",
        issuer: "Safaricom PLC",
        face_value: 50000,
        coupon_rate: 15.0,
        maturity_date: "2024-06-30",
        current_price: 51200,
        yield_to_maturity: 14.2,
        risk_rating: "AA",
      },
      {
        bond_type: "corporate",
        issuer: "KCB Bank",
        face_value: 75000,
        coupon_rate: 13.5,
        maturity_date: "2026-03-15",
        current_price: 76800,
        yield_to_maturity: 12.9,
        risk_rating: "AA-",
      },
    ];

    res.json(marketData);
  } catch (error) {
    console.error("Error fetching bond market data:", error);
    res.status(500).json({ message: "Error fetching bond market data" });
  }
});

// Get investment statistics
router.get("/statistics", authenticateToken, async (req, res) => {
  try {
    // Total investments
    const totalInvestments = await getRow(
      "SELECT COUNT(*) as count FROM investments WHERE user_id = ?",
      [req.user.id]
    );

    // Active investments
    const activeInvestments = await getRow(
      "SELECT COUNT(*) as count FROM investments WHERE user_id = ? AND status = 'active'",
      [req.user.id]
    );

    // Total invested amount
    const totalInvested = await getRow(
      "SELECT SUM(amount) as total FROM investments WHERE user_id = ?",
      [req.user.id]
    );

    // Current portfolio value
    const currentValue = await getRow(
      "SELECT SUM(current_value) as total FROM investments WHERE user_id = ? AND status = 'active'",
      [req.user.id]
    );

    // Total profit/loss
    const totalPL = (currentValue.total || 0) - (totalInvested.total || 0);
    const totalPLPercentage =
      totalInvested.total > 0 ? (totalPL / totalInvested.total) * 100 : 0;

    // By investment type
    const byType = await getAll(
      `SELECT investment_type, COUNT(*) as count, SUM(amount) as total_invested,
              SUM(current_value) as current_value
       FROM investments 
       WHERE user_id = ? AND status = 'active'
       GROUP BY investment_type`,
      [req.user.id]
    );

    res.json({
      total_investments: totalInvestments.count || 0,
      active_investments: activeInvestments.count || 0,
      total_invested: totalInvested.total || 0,
      current_value: currentValue.total || 0,
      total_profit_loss: totalPL,
      total_profit_loss_percentage: totalPLPercentage,
      by_type: byType,
    });
  } catch (error) {
    console.error("Error fetching investment statistics:", error);
    res.status(500).json({ message: "Error fetching investment statistics" });
  }
});

module.exports = router;
