const express = require('express');
const { runQuery, getRow, getAll } = require('../database/database');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Create a new group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      max_members,
      meeting_frequency,
      meeting_day,
      meeting_time,
      meeting_location,
      contribution_amount
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        error: 'Group name and description are required'
      });
    }

    // Check if group name already exists
    const existingGroup = await getRow(
      'SELECT id FROM groups WHERE name = ?',
      [name]
    );

    if (existingGroup) {
      return res.status(409).json({
        error: 'Group with this name already exists'
      });
    }

    // Insert new group
    const result = await runQuery(`
      INSERT INTO groups (
        name, description, max_members, meeting_frequency, meeting_day,
        meeting_time, meeting_location, contribution_amount, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, max_members || 20, meeting_frequency || 'monthly',
        meeting_day, meeting_time, meeting_location, contribution_amount || 0, req.user.userId]);

    // Add creator as group leader
    await runQuery(`
      INSERT INTO group_members (group_id, user_id, role, status)
      VALUES (?, ?, 'leader', 'active')
    `, [result.id, req.user.userId]);

    // Update group member count
    await runQuery(`
      UPDATE groups SET current_members = 1 WHERE id = ?
    `, [result.id]);

    // Get the created group
    const group = await getRow(`
      SELECT g.*, u.first_name, u.last_name
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Group created successfully',
      group
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      error: 'Failed to create group',
      message: error.message
    });
  }
});

// Get all groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE g.status = ?';
      params.push(status);
    }

    const groups = await getAll(`
      SELECT g.*, u.first_name, u.last_name,
             (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') as member_count
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      ${whereClause}
      ORDER BY g.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total FROM groups g ${whereClause}
    `, params);

    res.json({
      groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      error: 'Failed to get groups',
      message: error.message
    });
  }
});

// Get user's groups
router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const groups = await getAll(`
      SELECT g.*, gm.role as member_role, gm.joined_date,
             u.first_name, u.last_name
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE gm.user_id = ? AND gm.status = 'active'
      ORDER BY g.created_at DESC
    `, [req.user.userId]);

    res.json({
      groups
    });

  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({
      error: 'Failed to get user groups',
      message: error.message
    });
  }
});

// Get group details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await getRow(`
      SELECT g.*, u.first_name, u.last_name
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ?
    `, [id]);

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // Get group members
    const members = await getAll(`
      SELECT gm.*, u.first_name, u.last_name, u.username, u.phone, u.email
      FROM group_members gm
      LEFT JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ? AND gm.status = 'active'
      ORDER BY gm.joined_date ASC
    `, [id]);

    // Check if current user is a member
    const userMembership = await getRow(`
      SELECT * FROM group_members 
      WHERE group_id = ? AND user_id = ? AND status = 'active'
    `, [id, req.user.userId]);

    res.json({
      group,
      members,
      is_member: !!userMembership,
      user_role: userMembership ? userMembership.role : null
    });

  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      error: 'Failed to get group details',
      message: error.message
    });
  }
});

// Join group
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await getRow('SELECT * FROM groups WHERE id = ?', [id]);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    if (group.status !== 'active') {
      return res.status(400).json({
        error: 'Group is not active'
      });
    }

    // Check if user is already a member
    const existingMembership = await getRow(`
      SELECT * FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `, [id, req.user.userId]);

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return res.status(400).json({
          error: 'You are already a member of this group'
        });
      } else {
        // Reactivate membership
        await runQuery(`
          UPDATE group_members SET status = 'active', joined_date = CURRENT_TIMESTAMP
          WHERE group_id = ? AND user_id = ?
        `, [id, req.user.userId]);
      }
    } else {
      // Check if group is full
      const memberCount = await getRow(`
        SELECT COUNT(*) as count FROM group_members 
        WHERE group_id = ? AND status = 'active'
      `, [id]);

      if (memberCount.count >= group.max_members) {
        return res.status(400).json({
          error: 'Group is full'
        });
      }

      // Add new member
      await runQuery(`
        INSERT INTO group_members (group_id, user_id, role, status)
        VALUES (?, ?, 'member', 'active')
      `, [id, req.user.userId]);
    }

    // Update group member count
    await runQuery(`
      UPDATE groups SET current_members = (
        SELECT COUNT(*) FROM group_members 
        WHERE group_id = ? AND status = 'active'
      ) WHERE id = ?
    `, [id, id]);

    res.json({
      message: 'Successfully joined the group'
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      error: 'Failed to join group',
      message: error.message
    });
  }
});

// Leave group
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await getRow(`
      SELECT * FROM group_members 
      WHERE group_id = ? AND user_id = ? AND status = 'active'
    `, [id, req.user.userId]);

    if (!membership) {
      return res.status(400).json({
        error: 'You are not a member of this group'
      });
    }

    // Check if user is the group leader
    if (membership.role === 'leader') {
      return res.status(400).json({
        error: 'Group leader cannot leave. Please transfer leadership first.'
      });
    }

    // Remove membership
    await runQuery(`
      UPDATE group_members SET status = 'inactive'
      WHERE group_id = ? AND user_id = ?
    `, [id, req.user.userId]);

    // Update group member count
    await runQuery(`
      UPDATE groups SET current_members = (
        SELECT COUNT(*) FROM group_members 
        WHERE group_id = ? AND status = 'active'
      ) WHERE id = ?
    `, [id, id]);

    res.json({
      message: 'Successfully left the group'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      error: 'Failed to leave group',
      message: error.message
    });
  }
});

// Update group (admin/manager or group leader only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      max_members,
      meeting_frequency,
      meeting_day,
      meeting_time,
      meeting_location,
      contribution_amount,
      status
    } = req.body;

    const group = await getRow('SELECT * FROM groups WHERE id = ?', [id]);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // Check permissions
    const membership = await getRow(`
      SELECT * FROM group_members 
      WHERE group_id = ? AND user_id = ? AND status = 'active'
    `, [id, req.user.userId]);

    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        (!membership || membership.role !== 'leader')) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    await runQuery(`
      UPDATE groups SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        max_members = COALESCE(?, max_members),
        meeting_frequency = COALESCE(?, meeting_frequency),
        meeting_day = COALESCE(?, meeting_day),
        meeting_time = COALESCE(?, meeting_time),
        meeting_location = COALESCE(?, meeting_location),
        contribution_amount = COALESCE(?, contribution_amount),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, max_members, meeting_frequency, meeting_day,
        meeting_time, meeting_location, contribution_amount, status, id]);

    // Get updated group
    const updatedGroup = await getRow(`
      SELECT g.*, u.first_name, u.last_name
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ?
    `, [id]);

    res.json({
      message: 'Group updated successfully',
      group: updatedGroup
    });

  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      error: 'Failed to update group',
      message: error.message
    });
  }
});

// Get group statistics
router.get('/stats/overview', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const stats = await getRow(`
      SELECT 
        COUNT(*) as total_groups,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_groups,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_groups,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_groups,
        AVG(current_members) as average_members_per_group,
        SUM(current_members) as total_members,
        AVG(contribution_amount) as average_contribution
      FROM groups
    `);

    res.json({
      stats
    });

  } catch (error) {
    console.error('Group stats error:', error);
    res.status(500).json({
      error: 'Failed to get group statistics',
      message: error.message
    });
  }
});

module.exports = router; 