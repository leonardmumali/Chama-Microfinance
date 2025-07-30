const express = require('express');
const { runQuery, getRow, getAll } = require('../database/database');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Get user's savings account
router.get('/my-account', authenticateToken, async (req, res) => {
  try {
    const account = await getRow(`
      SELECT s.*, u.first_name, u.last_name, u.username
      FROM savings s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ? AND s.account_type = 'personal'
    `, [req.user.userId]);

    if (!account) {
      return res.status(404).json({
        error: 'Savings account not found'
      });
    }

    res.json({
      account
    });

  } catch (error) {
    console.error('Get savings account error:', error);
    res.status(500).json({
      error: 'Failed to get savings account',
      message: error.message
    });
  }
});

// Get all savings accounts (admin/manager only)
router.get('/', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE s.status = ?';
      params.push(status);
    }

    const accounts = await getAll(`
      SELECT s.*, u.first_name, u.last_name, u.username, u.phone, u.email
      FROM savings s
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total FROM savings s ${whereClause}
    `, params);

    res.json({
      accounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get all savings error:', error);
    res.status(500).json({
      error: 'Failed to get savings accounts',
      message: error.message
    });
  }
});

// Deposit money
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Valid deposit amount is required'
      });
    }

    // Get user's savings account
    const account = await getRow(`
      SELECT * FROM savings WHERE user_id = ? AND account_type = 'personal'
    `, [req.user.userId]);

    if (!account) {
      return res.status(404).json({
        error: 'Savings account not found'
      });
    }

    if (account.status !== 'active') {
      return res.status(400).json({
        error: 'Account is not active'
      });
    }

    // Generate transaction number
    const transactionNumber = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Calculate new balance
    const newBalance = parseFloat(account.balance) + parseFloat(amount);

    // Update account balance
    await runQuery(`
      UPDATE savings SET balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newBalance, account.id]);

    // Create transaction record
    await runQuery(`
      INSERT INTO transactions (
        transaction_number, user_id, type, amount, balance_before, balance_after,
        description, reference_id, reference_type, status
      ) VALUES (?, ?, 'deposit', ?, ?, ?, ?, ?, 'savings', 'completed')
    `, [transactionNumber, req.user.userId, amount, account.balance, newBalance, 
        description || `Deposit to savings account`, account.id]);

    res.json({
      message: 'Deposit successful',
      transaction_number: transactionNumber,
      amount,
      new_balance: newBalance
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      error: 'Failed to process deposit',
      message: error.message
    });
  }
});

// Withdraw money
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Valid withdrawal amount is required'
      });
    }

    // Get user's savings account
    const account = await getRow(`
      SELECT * FROM savings WHERE user_id = ? AND account_type = 'personal'
    `, [req.user.userId]);

    if (!account) {
      return res.status(404).json({
        error: 'Savings account not found'
      });
    }

    if (account.status !== 'active') {
      return res.status(400).json({
        error: 'Account is not active'
      });
    }

    // Check if sufficient balance
    if (parseFloat(account.balance) < parseFloat(amount)) {
      return res.status(400).json({
        error: 'Insufficient balance'
      });
    }

    // Generate transaction number
    const transactionNumber = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Calculate new balance
    const newBalance = parseFloat(account.balance) - parseFloat(amount);

    // Update account balance
    await runQuery(`
      UPDATE savings SET balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newBalance, account.id]);

    // Create transaction record
    await runQuery(`
      INSERT INTO transactions (
        transaction_number, user_id, type, amount, balance_before, balance_after,
        description, reference_id, reference_type, status
      ) VALUES (?, ?, 'withdrawal', ?, ?, ?, ?, ?, 'savings', 'completed')
    `, [transactionNumber, req.user.userId, amount, account.balance, newBalance, 
        description || `Withdrawal from savings account`, account.id]);

    res.json({
      message: 'Withdrawal successful',
      transaction_number: transactionNumber,
      amount,
      new_balance: newBalance
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      error: 'Failed to process withdrawal',
      message: error.message
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.user_id = ?';
    let params = [req.user.userId];

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }

    const transactions = await getAll(`
      SELECT t.*, s.account_number
      FROM transactions t
      LEFT JOIN savings s ON t.reference_id = s.id AND t.reference_type = 'savings'
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
      error: 'Failed to get transaction history',
      message: error.message
    });
  }
});

// Get savings statistics
router.get('/stats/overview', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const stats = await getRow(`
      SELECT 
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_accounts,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_accounts,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_accounts,
        SUM(balance) as total_balance,
        AVG(balance) as average_balance,
        SUM(CASE WHEN account_type = 'personal' THEN balance ELSE 0 END) as personal_balance,
        SUM(CASE WHEN account_type = 'group' THEN balance ELSE 0 END) as group_balance
      FROM savings
    `);

    res.json({
      stats
    });

  } catch (error) {
    console.error('Savings stats error:', error);
    res.status(500).json({
      error: 'Failed to get savings statistics',
      message: error.message
    });
  }
});

// Update account status (admin/manager only)
router.put('/:id/status', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'closed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status'
      });
    }

    const account = await getRow('SELECT * FROM savings WHERE id = ?', [id]);
    if (!account) {
      return res.status(404).json({
        error: 'Savings account not found'
      });
    }

    await runQuery(`
      UPDATE savings SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);

    res.json({
      message: 'Account status updated successfully',
      account_id: id,
      new_status: status
    });

  } catch (error) {
    console.error('Update account status error:', error);
    res.status(500).json({
      error: 'Failed to update account status',
      message: error.message
    });
  }
});

module.exports = router; 