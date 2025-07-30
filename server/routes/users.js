const express = require('express');
const { runQuery, getRow, getAll } = require('../database/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'status = ?';
      params.push(status);
    }

    if (role) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'role = ?';
      params.push(role);
    }

    const users = await getAll(`
      SELECT id, username, email, first_name, last_name, phone, role, status, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: error.message
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getRow(`
      SELECT id, username, email, first_name, last_name, phone, id_number,
             date_of_birth, address, occupation, monthly_income, profile_image,
             role, status, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      phone,
      address,
      occupation,
      monthly_income,
      role,
      status
    } = req.body;

    const user = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    await runQuery(`
      UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        occupation = COALESCE(?, occupation),
        monthly_income = COALESCE(?, monthly_income),
        role = COALESCE(?, role),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [first_name, last_name, phone, address, occupation, monthly_income, role, status, id]);

    // Get updated user
    const updatedUser = await getRow(`
      SELECT id, username, email, first_name, last_name, phone, id_number,
             date_of_birth, address, occupation, monthly_income, profile_image,
             role, status, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user has active loans or savings
    const activeLoans = await getRow(`
      SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status IN ('active', 'pending')
    `, [id]);

    const activeSavings = await getRow(`
      SELECT COUNT(*) as count FROM savings WHERE user_id = ? AND status = 'active'
    `, [id]);

    if (activeLoans.count > 0 || activeSavings.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete user with active loans or savings accounts'
      });
    }

    await runQuery('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getRow(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_users,
        COUNT(CASE WHEN role = 'member' THEN 1 END) as member_users,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_users_30_days
      FROM users
    `);

    res.json({
      stats
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      error: 'Failed to get user statistics',
      message: error.message
    });
  }
});

module.exports = router; 