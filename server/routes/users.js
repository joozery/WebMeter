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
  level: Joi.string().valid('Admin', 'admin', 'Manager', 'manager', 'Supervisor', 'supervisor', 'Engineer', 'engineer', 'Operator', 'operator', 'Super Admin', 'viewer').optional(),
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
        u.id,
        u.username,
        u.email,
        u.name,
        u.surname,
        u.address,
        u.phone,
        u.line_id as lineId,
        u.status,
        u.created_at,
        u.updated_at,
        r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      ORDER BY u.id ASC
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
        u.id,
        u.username,
        u.email,
        u.name,
        u.surname,
        u.address,
        u.phone,
        u.line_id as lineId,
        u.status,
        u.created_at,
        u.updated_at,
        r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ?
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
      FROM users 
      WHERE username = ? OR email = ?
    `;
    const [checkRows] = await db.query(checkQuery, [username, email]);

    if (checkRows.length > 0) {
      const existingUser = checkRows[0];
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
      SELECT id FROM roles 
      WHERE role_name = CASE 
        WHEN ? = 'Admin' THEN 'System Administrator'
        WHEN ? = 'Manager' THEN 'Plant Manager'
        WHEN ? = 'Supervisor' THEN 'Operations Supervisor'
        WHEN ? = 'Engineer' THEN 'Maintenance Engineer'
        WHEN ? = 'Operator' THEN 'Control Room Operator'
        ELSE 'Control Room Operator'
      END
    `;
    const [roleRows] = await db.query(roleQuery, [level, level, level, level, level]);
    const roleId = roleRows[0]?.id;

    // Insert new user
    const insertQuery = `
      INSERT INTO users (
        username, email, password_hash, name, surname, address, phone, line_id,
        level, role_id, status, note, created_at, updated_at, group_id
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?
      )
    `;

    await db.query(insertQuery, [
      username, email, hashedPassword, name, surname, 
      address || null, phone || null, lineId || null, level, roleId, status, note || null, groupId || null
    ]);

    const [newUserRows] = await db.query('SELECT id, username, email, name, surname, address, phone, line_id as lineId, level, status, note, group_id, created_at FROM users ORDER BY id DESC LIMIT 1');

    const newUser = newUserRows[0];

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
    const [userCheckRows = []] = await db.query(userCheckQuery, [id]);

    if (userCheckRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check for username/email conflicts (exclude current user)
    if (value.username || value.email) {
      const checkQuery = `
        SELECT id, username, email 
        FROM users 
        WHERE (username = ? OR email = ?) AND id != ?
      `;
      const [conflictRows = []] = await db.query(checkQuery, [
        value.username || null,
        value.email || null,
        id
      ]);

      if (conflictRows.length > 0) {
        const existingUser = conflictRows[0];
        const conflictField = existingUser.username === value.username ? 'username' : 'email';
        return res.status(409).json({
          success: false,
          error: `${conflictField} already exists`,
          conflictField
        });
      }
    }

    // If client sent level, map it to role assignment via user_roles
    if (value.level) {
      const roleName = String(value.level).trim();
      // Find role id by name (case-sensitive stored name)
      const [roleLookupRows = []] = await db.query('SELECT id FROM roles WHERE name = ?', [roleName]);
      const roleIdToAssign = roleLookupRows[0]?.id || null;
      if (roleIdToAssign) {
        await db.query('DELETE FROM user_roles WHERE user_id = ?', [id]);
        await db.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, roleIdToAssign]);
      }
      // Remove level from regular column updates to avoid unknown column error
      delete value.level;
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
      updateFields.push(`${dbField} = ?`);
      updateValues.push(fieldValue);
    }

    if (updateFields.length === 0) {
      // Nothing to update on users table (likely only role change). Treat as success.
      return res.json({
        success: true,
        message: 'User role updated successfully',
        data: { id: Number(id) }
      });
    }

    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    updateValues.push(id);

    console.log('Update query:', updateQuery); // Debug log
    console.log('Update values:', updateValues); // Debug log

    await db.query(updateQuery, updateValues);

    const [updatedRows] = await db.query(
      'SELECT id, username, email, name, surname, address, phone, line_id as lineId, status, note, group_id, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedRows[0]
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
    const userCheckQuery = 'SELECT id, username FROM users WHERE id = ?';
    const [userRows] = await db.query(userCheckQuery, [id]);

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete user
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    await db.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: { id: Number(id) }
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

    await db.query(updateQuery, [status, id]);

    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: { id: Number(id), status }
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

    const [rows] = await db.query(query);

    res.json({
      success: true,
      data: rows
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
    const [rows2] = await db.query(`
      SELECT u.id, u.username, u.email, u.name, u.surname, u.phone, u.status, eg.name as group_name
      FROM users.users u
      LEFT JOIN users.email_groups eg ON u.group_id = eg.id
      WHERE u.group_id = $1 AND u.status = 'active'
      ORDER BY u.id ASC
    `, [groupId]);
    
    res.json({ success: true, data: rows2 });
  } catch (err) {
    console.error('Error fetching users by group:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users by group', message: err.message });
  }
});

// GET /api/users/line-group/:groupId - Get users by line group
router.get('/line-group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  
  try {
    const [rows3] = await db.query(`
      SELECT u.id, u.username, u.email, u.name, u.surname, u.phone, u.line_id, u.status, lg.name as group_name
      FROM users.users u
      LEFT JOIN users.line_groups lg ON u.groupline_id = lg.id
      WHERE u.groupline_id = $1 AND u.status = 'active' AND u.line_id IS NOT NULL AND u.line_id != ''
      ORDER BY u.id ASC
    `, [groupId]);
    
    res.json({ success: true, data: rows3 });
  } catch (err) {
    console.error('Error fetching users by line group:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users by line group', message: err.message });
  }
});

module.exports = router;
