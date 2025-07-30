const express = require('express');
const { runQuery, getRow, getAll } = require('../database/database');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Get user's transactions
router.get('/my-transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.user_id = ?';
    let params = [req.user.userId];

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }

    if (start_date) {
      whereClause += ' AND DATE(t.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND DATE(t.created_at) <= ?';
      params.push(end_date);
    }

    const transactions = await getAll(`
      SELECT t.*, 
             s.account_number as savings_account,
             l.loan_number
      FROM transactions t
      LEFT JOIN savings s ON t.reference_id = s.id AND t.reference_type = 'savings'
      LEFT JOIN loans l ON t.reference_id = l.id AND t.reference_type = 'loan'
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total FROM transactions t ${whereClause}
    `, params);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to get transactions',
      message: error.message
    });
  }
});

// Get all transactions (admin/manager only)
router.get('/', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status, 
      user_id,
      start_date, 
      end_date 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (type) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 't.type = ?';
      params.push(type);
    }

    if (status) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 't.status = ?';
      params.push(status);
    }

    if (user_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 't.user_id = ?';
      params.push(user_id);
    }

    if (start_date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'DATE(t.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'DATE(t.created_at) <= ?';
      params.push(end_date);
    }

    const transactions = await getAll(`
      SELECT t.*, 
             u.first_name, u.last_name, u.username,
             s.account_number as savings_account,
             l.loan_number
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN savings s ON t.reference_id = s.id AND t.reference_type = 'savings'
      LEFT JOIN loans l ON t.reference_id = l.id AND t.reference_type = 'loan'
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total FROM transactions t ${whereClause}
    `, params);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      error: 'Failed to get transactions',
      message: error.message
    });
  }
});

// Get transaction statistics
router.get('/stats/overview', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let whereClause = '';
    let params = [];

    if (start_date) {
      whereClause += 'WHERE DATE(created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'DATE(created_at) <= ?';
      params.push(end_date);
    }

    const stats = await getRow(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals,
        SUM(CASE WHEN type = 'loan_disbursement' THEN amount ELSE 0 END) as total_loan_disbursements,
        SUM(CASE WHEN type = 'loan_repayment' THEN amount ELSE 0 END) as total_loan_repayments,
        AVG(amount) as average_transaction_amount
      FROM transactions
      ${whereClause}
    `, params);

    res.json({
      stats
    });

  } catch (error) {
    console.error('Transaction stats error:', error);
    res.status(500).json({
      error: 'Failed to get transaction statistics',
      message: error.message
    });
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await getRow(`
      SELECT t.*, 
             u.first_name, u.last_name, u.username, u.phone,
             s.account_number as savings_account,
             l.loan_number
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN savings s ON t.reference_id = s.id AND t.reference_type = 'savings'
      LEFT JOIN loans l ON t.reference_id = l.id AND t.reference_type = 'loan'
      WHERE t.id = ?
    `, [id]);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    // Check if user can view this transaction
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && transaction.user_id !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json({
      transaction
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      error: 'Failed to get transaction',
      message: error.message
    });
  }
});

module.exports = router; 