const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const db = require('../config/database');

const router = express.Router();

// Validation schemas
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(1).max(100).required(),
  surname: Joi.string().max(100).allow('', null).default(''),
  address: Joi.string().max(500).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  lineId: Joi.string().max(50).allow('', null),
  level: Joi.string().valid('Admin', 'Manager', 'Supervisor', 'Engineer', 'Operator').required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  note: Joi.string().max(1000).allow('', null),
  groupId: Joi.number().integer().min(1).allow(null)
});

const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  name: Joi.string().min(1).max(100).optional(),
  surname: Joi.string().max(100).allow('', null).optional(),
  address: Joi.string().max(500).allow('', null).optional(),
  phone: Joi.string().max(20).allow('', null).optional(),
  lineId: Joi.string().max(50).allow('', null).optional(),
  level: Joi.string().valid('Admin', 'Manager', 'Supervisor', 'Engineer', 'Operator').optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  note: Joi.string().max(1000).allow('', null).optional(),
  groupId: Joi.number().integer().min(1).allow(null).optional(),
  lineGroupId: Joi.number().integer().min(1).allow(null).optional()
});

// GET /api/users - ดึงรายชื่อผู้ใช้ทั้งหมด
router.get('/', async (req, res) => {
  try {
    const { 
      search = '', 
      level = '', 
      status = '', 
      sortBy = 'id', 
      sortOrder = 'ASC',
      page = 1,
      limit = 100
    } = req.query;

    // Simple query without parameters for now
    let query = `
      SELECT 
        id,
        username,
        email,
        name,
        surname,
        address,
        phone,
        line_id as lineId,
        created_at,
        updated_at
      FROM users
      ORDER BY id ASC
      LIMIT 10
    `;

    const [result] = await db.query(query);

    // Get total count for pagination
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countResult[0].total);

    res.json({
      success: true,
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /api/users/:id - ดึงข้อมูลผู้ใช้ตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const query = `
      SELECT 
        id,
        username,
        email,
        name,
        surname,
        address,
        phone,
        line_id as lineId,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
    `;

    const [result] = await db.query(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// POST /api/users - สร้างผู้ใช้ใหม่
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { username, email, password, name, surname, address, phone, lineId, level, status, note, groupId } = value;

    // Check if username or email already exists
    const checkQuery = `
      SELECT id, username, email 
      FROM users.users 
      WHERE username = $1 OR email = $2
    `;
    const checkResult = await db.query(checkQuery, [username, email]);

    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      const conflictField = existingUser.username === username ? 'username' : 'email';
      return res.status(409).json({
        success: false,
        error: `${conflictField} already exists`,
        conflictField
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get role ID based on level
    const roleQuery = `
      SELECT id FROM users.roles 
      WHERE role_name = CASE 
        WHEN $1 = 'Admin' THEN 'System Administrator'
        WHEN $1 = 'Manager' THEN 'Plant Manager'
        WHEN $1 = 'Supervisor' THEN 'Operations Supervisor'
        WHEN $1 = 'Engineer' THEN 'Maintenance Engineer'
        WHEN $1 = 'Operator' THEN 'Control Room Operator'
        ELSE 'Control Room Operator'
      END
    `;
    const roleResult = await db.query(roleQuery, [level]);
    const roleId = roleResult.rows[0]?.id;

    // Insert new user
    const insertQuery = `
      INSERT INTO users.users (
        username, email, password_hash, name, surname, address, phone, line_id,
        level, role_id, status, note, created_at, updated_at, group_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $13
      ) RETURNING id, username, email, name, surname, address, phone, line_id as "lineId", level, status, note, group_id, created_at
    `;

    const insertResult = await db.query(insertQuery, [
      username, email, hashedPassword, name, surname, 
      address || null, phone || null, lineId || null, level, roleId, status, note || null, groupId || null
    ]);

    const newUser = insertResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname,
        address: newUser.address,
        phone: newUser.phone,
        lineId: newUser.lineId,
        level: newUser.level,
        status: newUser.status,
        note: newUser.note,
        group_id: newUser.group_id,
        created_at: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// PUT /api/users/:id - แก้ไขข้อมูลผู้ใช้
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Validate input
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Check if user exists
    const userCheckQuery = 'SELECT id FROM users WHERE id = ?';
    const userCheckResult = await db.query(userCheckQuery, [id]);

    if (userCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check for username/email conflicts (exclude current user)
    if (value.username || value.email) {
      const checkQuery = `
        SELECT id, username, email 
        FROM users.users 
        WHERE (username = $1 OR email = $2) AND id != $3
      `;
      const checkResult = await db.query(checkQuery, [
        value.username || '', 
        value.email || '', 
        id
      ]);

      if (checkResult.rows.length > 0) {
        const existingUser = checkResult.rows[0];
        const conflictField = existingUser.username === value.username ? 'username' : 'email';
        return res.status(409).json({
          success: false,
          error: `${conflictField} already exists`,
          conflictField
        });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    console.log('Updating user with data:', value); // Debug log

    for (const [key, fieldValue] of Object.entries(value)) {
      // Convert camelCase to snake_case for database fields
      let dbField = key;
      if (key === 'groupId') {
        dbField = 'group_id';
      } else if (key === 'lineGroupId') {
        dbField = 'groupline_id';
      } else if (key === 'lineId') {
        dbField = 'line_id';
      }
      updateFields.push(`${dbField} = $${paramIndex}`);
      updateValues.push(fieldValue);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE users.users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, name, surname, address, phone, line_id as "lineId", level, status, note, group_id, updated_at
    `;

    updateValues.push(id);

    console.log('Update query:', updateQuery); // Debug log
    console.log('Update values:', updateValues); // Debug log

    const updateResult = await db.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// DELETE /api/users/:id - ลบผู้ใช้
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Check if user exists
    const userCheckQuery = 'SELECT id, username FROM users.users WHERE id = $1';
    const userCheckResult = await db.query(userCheckQuery, [id]);

    if (userCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete user
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    const deleteResult = await db.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deleteResult.rows[0]
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// PATCH /api/users/:id/status - เปลี่ยนสถานะผู้ใช้
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "inactive"'
      });
    }

    const updateQuery = `
      UPDATE users 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const result = await db.query(updateQuery, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      message: error.message
    });
  }
});

// GET /api/users/stats/summary - สถิติสรุปผู้ใช้
router.get('/stats/summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        level,
        COUNT(*) as user_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count
      FROM users.users
      GROUP BY level
      ORDER BY 
        CASE level 
          WHEN 'Admin' THEN 1
          WHEN 'Manager' THEN 2
          WHEN 'Supervisor' THEN 3
          WHEN 'Engineer' THEN 4
          WHEN 'Operator' THEN 5
          ELSE 6
        END
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: error.message
    });
  }
});

// GET /api/users/group/:groupId - Get users by email group
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.name, u.surname, u.phone, u.status, eg.name as group_name
      FROM users.users u
      LEFT JOIN users.email_groups eg ON u.group_id = eg.id
      WHERE u.group_id = $1 AND u.status = 'active'
      ORDER BY u.id ASC
    `, [groupId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching users by group:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users by group', message: err.message });
  }
});

// GET /api/users/line-group/:groupId - Get users by line group
router.get('/line-group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.name, u.surname, u.phone, u.line_id, u.status, lg.name as group_name
      FROM users.users u
      LEFT JOIN users.line_groups lg ON u.groupline_id = lg.id
      WHERE u.groupline_id = $1 AND u.status = 'active' AND u.line_id IS NOT NULL AND u.line_id != ''
      ORDER BY u.id ASC
    `, [groupId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching users by line group:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users by line group', message: err.message });
  }
});

module.exports = router;
