const express = require('express');
const { runQuery, getRow, getAll } = require('../database/database');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Apply for a loan
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const {
      loan_type,
      amount,
      term_months,
      purpose,
      group_id
    } = req.body;

    if (!loan_type || !amount || !term_months || !purpose) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['loan_type', 'amount', 'term_months', 'purpose']
      });
    }

    // Validate loan amount
    if (amount <= 0 || amount > 1000000) {
      return res.status(400).json({
        error: 'Invalid loan amount. Must be between 1 and 1,000,000'
      });
    }

    // Validate term
    if (term_months < 1 || term_months > 60) {
      return res.status(400).json({
        error: 'Invalid loan term. Must be between 1 and 60 months'
      });
    }

    // Calculate interest rate based on loan type
    let interestRate;
    switch (loan_type) {
      case 'personal':
        interestRate = 12.0;
        break;
      case 'business':
        interestRate = 15.0;
        break;
      case 'emergency':
        interestRate = 18.0;
        break;
      case 'education':
        interestRate = 10.0;
        break;
      default:
        return res.status(400).json({
          error: 'Invalid loan type'
        });
    }

    // Calculate monthly payment and total payable
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = (amount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, term_months)) / 
                          (Math.pow(1 + monthlyInterestRate, term_months) - 1);
    const totalPayable = monthlyPayment * term_months;

    // Generate loan number
    const loanNumber = 'LN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Calculate due date
    const dueDate = moment().add(term_months, 'months').format('YYYY-MM-DD');

    // Insert loan application
    const result = await runQuery(`
      INSERT INTO loans (
        user_id, group_id, loan_number, loan_type, amount, interest_rate,
        term_months, monthly_payment, total_payable, purpose, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.userId, group_id, loanNumber, loan_type, amount, interestRate, 
        term_months, monthlyPayment, totalPayable, purpose, dueDate]);

    // Get the created loan
    const loan = await getRow(`
      SELECT * FROM loans WHERE id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan
    });

  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({
      error: 'Failed to submit loan application',
      message: error.message
    });
  }
});

// Get user's loans
router.get('/my-loans', authenticateToken, async (req, res) => {
  try {
    const loans = await getAll(`
      SELECT l.*, 
             u.first_name, u.last_name, u.username,
             a.first_name as approved_by_first_name, a.last_name as approved_by_last_name
      FROM loans l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users a ON l.approved_by = a.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `, [req.user.userId]);

    res.json({
      loans
    });

  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({
      error: 'Failed to get loans',
      message: error.message
    });
  }
});

// Get all loans (admin/manager only)
router.get('/', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE l.status = ?';
      params.push(status);
    }

    const loans = await getAll(`
      SELECT l.*, 
             u.first_name, u.last_name, u.username, u.phone,
             a.first_name as approved_by_first_name, a.last_name as approved_by_last_name
      FROM loans l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users a ON l.approved_by = a.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total FROM loans l ${whereClause}
    `, params);

    res.json({
      loans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({
      error: 'Failed to get loans',
      message: error.message
    });
  }
});

// Get loan details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await getRow(`
      SELECT l.*, 
             u.first_name, u.last_name, u.username, u.phone, u.email,
             a.first_name as approved_by_first_name, a.last_name as approved_by_last_name
      FROM loans l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users a ON l.approved_by = a.id
      WHERE l.id = ?
    `, [id]);

    if (!loan) {
      return res.status(404).json({
        error: 'Loan not found'
      });
    }

    // Check if user can view this loan
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && loan.user_id !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Get loan payments
    const payments = await getAll(`
      SELECT * FROM loan_payments 
      WHERE loan_id = ? 
      ORDER BY payment_date ASC
    `, [id]);

    res.json({
      loan,
      payments
    });

  } catch (error) {
    console.error('Get loan details error:', error);
    res.status(500).json({
      error: 'Failed to get loan details',
      message: error.message
    });
  }
});

// Approve/reject loan (admin/manager only)
router.put('/:id/approve', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const loan = await getRow('SELECT * FROM loans WHERE id = ?', [id]);
    if (!loan) {
      return res.status(404).json({
        error: 'Loan not found'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        error: 'Loan is not in pending status'
      });
    }

    const updateData = {
      status,
      approved_by: req.user.userId,
      approved_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.disbursed_at = new Date().toISOString();
    }

    await runQuery(`
      UPDATE loans SET 
        status = ?, approved_by = ?, approved_at = ?, disbursed_at = ?
      WHERE id = ?
    `, [status, req.user.userId, updateData.approved_at, updateData.disbursed_at, id]);

    // If approved, create loan disbursement transaction
    if (status === 'approved') {
      const transactionNumber = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
      
      await runQuery(`
        INSERT INTO transactions (
          transaction_number, user_id, type, amount, balance_before, balance_after,
          description, reference_id, reference_type, status
        ) VALUES (?, ?, 'loan_disbursement', ?, 0, ?, ?, ?, 'loan', 'completed')
      `, [transactionNumber, loan.user_id, loan.amount, loan.amount, 
          `Loan disbursement - ${loan.loan_number}`, loan.id]);
    }

    res.json({
      message: `Loan ${status} successfully`,
      loan_id: id
    });

  } catch (error) {
    console.error('Loan approval error:', error);
    res.status(500).json({
      error: 'Failed to process loan approval',
      message: error.message
    });
  }
});

// Make loan payment
router.post('/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Valid payment amount is required'
      });
    }

    const loan = await getRow('SELECT * FROM loans WHERE id = ?', [id]);
    if (!loan) {
      return res.status(404).json({
        error: 'Loan not found'
      });
    }

    if (loan.user_id !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({
        error: 'Loan is not active'
      });
    }

    // Generate payment number
    const paymentNumber = 'PAY' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Calculate late fee if payment is overdue
    const dueDate = moment(loan.due_date);
    const paymentDate = moment(payment_date || new Date());
    const lateFee = paymentDate.isAfter(dueDate) ? amount * 0.05 : 0; // 5% late fee

    // Insert payment
    await runQuery(`
      INSERT INTO loan_payments (
        loan_id, payment_number, amount, payment_date, due_date, status, late_fee
      ) VALUES (?, ?, ?, ?, ?, 'paid', ?)
    `, [id, paymentNumber, amount, paymentDate.format('YYYY-MM-DD'), 
        loan.due_date, lateFee]);

    // Create transaction record
    const transactionNumber = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    await runQuery(`
      INSERT INTO transactions (
        transaction_number, user_id, type, amount, balance_before, balance_after,
        description, reference_id, reference_type, status
      ) VALUES (?, ?, 'loan_repayment', ?, 0, ?, ?, ?, 'loan', 'completed')
    `, [transactionNumber, loan.user_id, amount, amount, 
        `Loan repayment - ${loan.loan_number}`, loan.id]);

    res.json({
      message: 'Payment recorded successfully',
      payment_number: paymentNumber,
      amount,
      late_fee: lateFee
    });

  } catch (error) {
    console.error('Loan payment error:', error);
    res.status(500).json({
      error: 'Failed to record payment',
      message: error.message
    });
  }
});

// Get loan statistics
router.get('/stats/overview', authenticateToken, requireAdminOrManager, async (req, res) => {
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
        SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as active_amount
      FROM loans
    `);

    res.json({
      stats
    });

  } catch (error) {
    console.error('Loan stats error:', error);
    res.status(500).json({
      error: 'Failed to get loan statistics',
      message: error.message
    });
  }
});

module.exports = router; 