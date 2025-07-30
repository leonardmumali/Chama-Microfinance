const express = require("express");
const { runQuery, getRow, getAll } = require("../database/database");
const {
  authenticateToken,
  requireAdminOrManager,
} = require("../middleware/auth");
const moment = require("moment");

const router = express.Router();

// Enhanced loan types configuration
const LOAN_TYPES = {
  personal: {
    name: "Personal Loans",
    minAmount: 1000,
    maxAmount: 500000,
    minTerm: 3,
    maxTerm: 36,
    baseInterestRate: 12.0,
    requiresCollateral: false,
    requiresGuarantor: false,
    maxLoanToValue: 0.8,
  },
  group: {
    name: "Group Loans",
    minAmount: 5000,
    maxAmount: 2000000,
    minTerm: 6,
    maxTerm: 60,
    baseInterestRate: 10.0,
    requiresCollateral: false,
    requiresGuarantor: true,
    maxLoanToValue: 0.9,
  },
  business: {
    name: "Business Loans",
    minAmount: 10000,
    maxAmount: 5000000,
    minTerm: 12,
    maxTerm: 84,
    baseInterestRate: 15.0,
    requiresCollateral: true,
    requiresGuarantor: true,
    maxLoanToValue: 0.7,
  },
  women_youth: {
    name: "Women/Youth Empowerment Loans",
    minAmount: 2000,
    maxAmount: 300000,
    minTerm: 6,
    maxTerm: 48,
    baseInterestRate: 8.0,
    requiresCollateral: false,
    requiresGuarantor: true,
    maxLoanToValue: 0.85,
  },
  mortgage: {
    name: "Mortgages",
    minAmount: 500000,
    maxAmount: 50000000,
    minTerm: 120,
    maxTerm: 360,
    baseInterestRate: 9.5,
    requiresCollateral: true,
    requiresGuarantor: false,
    maxLoanToValue: 0.8,
  },
  bonds: {
    name: "Bonds (Loan-backed instruments)",
    minAmount: 100000,
    maxAmount: 10000000,
    minTerm: 60,
    maxTerm: 240,
    baseInterestRate: 11.0,
    requiresCollateral: true,
    requiresGuarantor: true,
    maxLoanToValue: 0.75,
  },
};

// Credit scoring engine
const calculateCreditScore = async (userId) => {
  try {
    // Get user's transaction history
    const transactions = await getAll(
      `
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 100
    `,
      [userId]
    );

    // Get user's loan history
    const loanHistory = await getAll(
      `
      SELECT * FROM enhanced_loans 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `,
      [userId]
    );

    // Get user's savings history
    const savingsHistory = await getAll(
      `
      SELECT * FROM savings 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `,
      [userId]
    );

    let score = 300; // Base score

    // Transaction history scoring (40% weight)
    if (transactions.length > 0) {
      const totalTransactions = transactions.length;
      const successfulTransactions = transactions.filter(
        (t) => t.status === "completed"
      ).length;
      const successRate = successfulTransactions / totalTransactions;

      score += Math.floor(successRate * 200); // Up to 200 points for good transaction history
    }

    // Loan repayment history (30% weight)
    if (loanHistory.length > 0) {
      const completedLoans = loanHistory.filter(
        (l) => l.status === "completed"
      );
      const defaultedLoans = loanHistory.filter(
        (l) => l.status === "defaulted"
      );

      if (completedLoans.length > 0) {
        score += 150; // Good repayment history
      }

      if (defaultedLoans.length > 0) {
        score -= defaultedLoans.length * 50; // Penalty for defaults
      }
    }

    // Savings behavior (20% weight)
    if (savingsHistory.length > 0) {
      const totalSavings = savingsHistory.reduce(
        (sum, s) => sum + (s.amount || 0),
        0
      );
      if (totalSavings > 10000) {
        score += 100; // Good savings behavior
      } else if (totalSavings > 5000) {
        score += 50;
      }
    }

    // Account age (10% weight)
    const user = await getRow("SELECT created_at FROM users WHERE id = ?", [
      userId,
    ]);
    if (user) {
      const accountAge = moment().diff(moment(user.created_at), "months");
      if (accountAge > 12) {
        score += 50;
      } else if (accountAge > 6) {
        score += 25;
      }
    }

    // Ensure score is within bounds
    score = Math.max(300, Math.min(850, score));

    return score;
  } catch (error) {
    console.error("Credit score calculation error:", error);
    return 500; // Default score
  }
};

// Loan calculator
const calculateLoanTerms = (amount, termMonths, interestRate, loanType) => {
  const monthlyInterestRate = interestRate / 100 / 12;
  const monthlyPayment =
    (amount *
      monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, termMonths)) /
    (Math.pow(1 + monthlyInterestRate, termMonths) - 1);
  const totalPayable = monthlyPayment * termMonths;
  const totalInterest = totalPayable - amount;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    interestRate,
    termMonths,
  };
};

// Get loan types and their configurations
router.get("/types", authenticateToken, async (req, res) => {
  try {
    res.json({
      loan_types: LOAN_TYPES,
    });
  } catch (error) {
    console.error("Get loan types error:", error);
    res.status(500).json({
      error: "Failed to get loan types",
      message: error.message,
    });
  }
});

// Loan calculator endpoint
router.post("/calculate", authenticateToken, async (req, res) => {
  try {
    const { loan_type, amount, term_months } = req.body;

    if (!loan_type || !amount || !term_months) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["loan_type", "amount", "term_months"],
      });
    }

    if (!LOAN_TYPES[loan_type]) {
      return res.status(400).json({
        error: "Invalid loan type",
      });
    }

    const loanConfig = LOAN_TYPES[loan_type];
    const creditScore = await calculateCreditScore(req.user.userId);

    // Adjust interest rate based on credit score
    let interestRate = loanConfig.baseInterestRate;
    if (creditScore < 500) {
      interestRate += 5.0;
    } else if (creditScore < 650) {
      interestRate += 2.0;
    } else if (creditScore > 750) {
      interestRate -= 1.0;
    }

    const loanTerms = calculateLoanTerms(
      amount,
      term_months,
      interestRate,
      loan_type
    );

    res.json({
      loan_terms: loanTerms,
      credit_score: creditScore,
      loan_config: loanConfig,
    });
  } catch (error) {
    console.error("Loan calculation error:", error);
    res.status(500).json({
      error: "Failed to calculate loan terms",
      message: error.message,
    });
  }
});

// Apply for a loan with enhanced features
router.post("/apply", authenticateToken, async (req, res) => {
  try {
    const {
      loan_type,
      amount,
      term_months,
      purpose,
      group_id,
      collateral_details,
      guarantor_ids,
      insurance_required = false,
    } = req.body;

    if (!loan_type || !amount || !term_months || !purpose) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["loan_type", "amount", "term_months", "purpose"],
      });
    }

    // Validate loan type
    if (!LOAN_TYPES[loan_type]) {
      return res.status(400).json({
        error: "Invalid loan type",
        available_types: Object.keys(LOAN_TYPES),
      });
    }

    const loanConfig = LOAN_TYPES[loan_type];

    // Validate amount and term
    if (amount < loanConfig.minAmount || amount > loanConfig.maxAmount) {
      return res.status(400).json({
        error: `Loan amount must be between ${loanConfig.minAmount} and ${loanConfig.maxAmount}`,
      });
    }

    if (term_months < loanConfig.minTerm || term_months > loanConfig.maxTerm) {
      return res.status(400).json({
        error: `Loan term must be between ${loanConfig.minTerm} and ${loanConfig.maxTerm} months`,
      });
    }

    // Calculate credit score
    const creditScore = await calculateCreditScore(req.user.userId);

    // Adjust interest rate based on credit score
    let interestRate = loanConfig.baseInterestRate;
    if (creditScore < 500) {
      interestRate += 5.0;
    } else if (creditScore < 650) {
      interestRate += 2.0;
    } else if (creditScore > 750) {
      interestRate -= 1.0;
    }

    // Calculate loan terms
    const loanTerms = calculateLoanTerms(
      amount,
      term_months,
      interestRate,
      loan_type
    );

    // Generate loan number
    const loanNumber =
      "LN" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Calculate due date
    const dueDate = moment().add(term_months, "months").format("YYYY-MM-DD");

    // Insert loan application
    const result = await runQuery(
      `
      INSERT INTO enhanced_loans (
        user_id, group_id, loan_number, loan_type, amount, interest_rate,
        term_months, monthly_payment, total_payable, purpose, due_date,
        credit_score, collateral_details, insurance_required, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `,
      [
        req.user.userId,
        group_id,
        loanNumber,
        loan_type,
        amount,
        interestRate,
        term_months,
        loanTerms.monthlyPayment,
        loanTerms.totalPayable,
        purpose,
        dueDate,
        creditScore,
        JSON.stringify(collateral_details),
        insurance_required,
      ]
    );

    // Insert guarantors if required
    if (
      loanConfig.requiresGuarantor &&
      guarantor_ids &&
      guarantor_ids.length > 0
    ) {
      for (const guarantorId of guarantor_ids) {
        await runQuery(
          `
          INSERT INTO loan_guarantors (loan_id, guarantor_id, status)
          VALUES (?, ?, 'pending')
        `,
          [result.id, guarantorId]
        );
      }
    }

    // Insert collateral if required
    if (loanConfig.requiresCollateral && collateral_details) {
      await runQuery(
        `
        INSERT INTO loan_collateral (loan_id, collateral_type, description, value, documents)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          result.id,
          collateral_details.type,
          collateral_details.description,
          collateral_details.value,
          JSON.stringify(collateral_details.documents),
        ]
      );
    }

    // Get the created loan
    const loan = await getRow(
      `
      SELECT * FROM enhanced_loans WHERE id = ?
    `,
      [result.id]
    );

    res.status(201).json({
      message: "Loan application submitted successfully",
      loan,
      credit_score: creditScore,
      loan_terms: loanTerms,
    });
  } catch (error) {
    console.error("Loan application error:", error);
    res.status(500).json({
      error: "Failed to submit loan application",
      message: error.message,
    });
  }
});

// Get user's loans with enhanced details
router.get("/my-loans", authenticateToken, async (req, res) => {
  try {
    const loans = await getAll(
      `
      SELECT l.*, 
             u.first_name, u.last_name, u.username,
             a.first_name as approved_by_first_name, a.last_name as approved_by_last_name,
             g.name as group_name
      FROM enhanced_loans l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users a ON l.approved_by = a.id
      LEFT JOIN groups g ON l.group_id = g.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `,
      [req.user.userId]
    );

    // Get payment schedules for each loan
    for (let loan of loans) {
      const payments = await getAll(
        `
        SELECT * FROM enhanced_loan_payments 
        WHERE loan_id = ? 
        ORDER BY payment_date ASC
      `,
        [loan.id]
      );

      const guarantors = await getAll(
        `
        SELECT lg.*, u.first_name, u.last_name, u.phone
        FROM loan_guarantors lg
        LEFT JOIN users u ON lg.guarantor_id = u.id
        WHERE lg.loan_id = ?
      `,
        [loan.id]
      );

      const collateral = await getRow(
        `
        SELECT * FROM loan_collateral WHERE loan_id = ?
      `,
        [loan.id]
      );

      loan.payments = payments;
      loan.guarantors = guarantors;
      loan.collateral = collateral;
    }

    res.json({
      loans,
    });
  } catch (error) {
    console.error("Get loans error:", error);
    res.status(500).json({
      error: "Failed to get loans",
      message: error.message,
    });
  }
});

// Make loan payment
router.post("/:id/payment", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, payment_method, payment_reference } =
      req.body;

    const loan = await getRow("SELECT * FROM enhanced_loans WHERE id = ?", [
      id,
    ]);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    if (loan.status !== "active") {
      return res.status(400).json({ error: "Loan is not active" });
    }

    // Generate payment number
    const paymentNumber =
      "PAY" +
      Date.now() +
      Math.random().toString(36).substr(2, 5).toUpperCase();

    // Calculate late fee if payment is overdue
    const dueDate = moment(loan.due_date);
    const paymentDate = moment(payment_date || new Date());
    const lateFee = paymentDate.isAfter(dueDate) ? amount * 0.05 : 0; // 5% late fee

    // Insert payment
    await runQuery(
      `
      INSERT INTO enhanced_loan_payments (
        loan_id, payment_number, amount, payment_date, due_date, status, late_fee,
        payment_method, payment_reference
      ) VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?)
    `,
      [
        id,
        paymentNumber,
        amount,
        paymentDate.format("YYYY-MM-DD"),
        loan.due_date,
        lateFee,
        payment_method,
        payment_reference,
      ]
    );

    // Create transaction record
    const transactionNumber =
      "TXN" +
      Date.now() +
      Math.random().toString(36).substr(2, 5).toUpperCase();

    await runQuery(
      `
      INSERT INTO transactions (
        transaction_number, user_id, type, amount, balance_before, balance_after,
        description, reference_id, reference_type, status
      ) VALUES (?, ?, 'loan_repayment', ?, 0, ?, ?, ?, 'loan', 'completed')
    `,
      [
        transactionNumber,
        loan.user_id,
        amount,
        amount,
        `Loan repayment - ${loan.loan_number}`,
        loan.id,
      ]
    );

    res.json({
      message: "Payment recorded successfully",
      payment_number: paymentNumber,
      amount,
      late_fee: lateFee,
      payment_method,
      payment_reference,
    });
  } catch (error) {
    console.error("Loan payment error:", error);
    res.status(500).json({
      error: "Failed to record payment",
      message: error.message,
    });
  }
});

// Loan restructuring
router.put(
  "/:id/restructure",
  authenticateToken,
  requireAdminOrManager,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { new_term_months, new_interest_rate, reason } = req.body;

      const loan = await getRow("SELECT * FROM enhanced_loans WHERE id = ?", [
        id,
      ]);
      if (!loan) {
        return res.status(404).json({
          error: "Loan not found",
        });
      }

      if (loan.status !== "active") {
        return res.status(400).json({
          error: "Only active loans can be restructured",
        });
      }

      // Calculate new loan terms
      const newLoanTerms = calculateLoanTerms(
        loan.amount,
        new_term_months,
        new_interest_rate,
        loan.loan_type
      );

      await runQuery(
        `
      UPDATE enhanced_loans SET 
        term_months = ?, interest_rate = ?, monthly_payment = ?, total_payable = ?,
        restructured_at = ?, restructured_by = ?, restructuring_reason = ?
      WHERE id = ?
    `,
        [
          new_term_months,
          new_interest_rate,
          newLoanTerms.monthlyPayment,
          newLoanTerms.totalPayable,
          new Date().toISOString(),
          req.user.userId,
          reason,
          id,
        ]
      );

      res.json({
        message: "Loan restructured successfully",
        new_terms: newLoanTerms,
      });
    } catch (error) {
      console.error("Loan restructuring error:", error);
      res.status(500).json({
        error: "Failed to restructure loan",
        message: error.message,
      });
    }
  }
);

// Get loan statistics
router.get(
  "/stats/overview",
  authenticateToken,
  requireAdminOrManager,
  async (req, res) => {
    try {
      const stats = await getRow(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_loans,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_loans,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_loans,
        COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans,
        SUM(CASE WHEN status IN ('approved', 'active', 'completed') THEN amount ELSE 0 END) as total_disbursed,
        SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as active_amount,
        AVG(credit_score) as avg_credit_score
      FROM enhanced_loans
    `);

      // Get loan type distribution
      const typeDistribution = await getAll(`
      SELECT loan_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM enhanced_loans
      GROUP BY loan_type
    `);

      // Get monthly disbursement trend
      const monthlyTrend = await getAll(`
      SELECT 
        strftime('%Y-%m', disbursed_at) as month,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM enhanced_loans
      WHERE disbursed_at IS NOT NULL
      GROUP BY strftime('%Y-%m', disbursed_at)
      ORDER BY month DESC
      LIMIT 12
    `);

      res.json({
        stats,
        type_distribution: typeDistribution,
        monthly_trend: monthlyTrend,
      });
    } catch (error) {
      console.error("Loan stats error:", error);
      res.status(500).json({
        error: "Failed to get loan statistics",
        message: error.message,
      });
    }
  }
);

module.exports = router;
