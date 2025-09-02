const express = require('express');
const Joi = require('joi');
const db = require('../config/database');

const router = express.Router();

// Validation schemas
const roleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500).allow('', null)
});

const assignRoleSchema = Joi.object({
  userId: Joi.number().integer().min(1).required(),
  roleId: Joi.number().integer().min(1).required()
});

// GET /api/roles - ดึงรายชื่อ roles ทั้งหมด
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        COUNT(ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id
      ORDER BY r.id ASC
    `;

    const [roles] = await db.query(query);

    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles',
      message: error.message
    });
  }
});

// GET /api/roles/:id - ดึงข้อมูล role ตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at
      FROM roles r
      WHERE r.id = ?
    `;

    const [roles] = await db.query(query, [id]);

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: roles[0]
    });

  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role',
      message: error.message
    });
  }
});

// POST /api/roles - สร้าง role ใหม่
router.post('/', async (req, res) => {
  try {
    const { error, value } = roleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const { name, description } = value;

    const query = `
      INSERT INTO roles (name, description)
      VALUES (?, ?)
    `;

    const [result] = await db.query(query, [name, description]);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        description,
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create role',
      message: error.message
    });
  }
});

// PUT /api/roles/:id - อัปเดต role
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = roleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const { name, description } = value;

    const query = `
      UPDATE roles 
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await db.query(query, [name, description, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: parseInt(id),
        name,
        description,
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role',
      message: error.message
    });
  }
});

// DELETE /api/roles/:id - ลบ role
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role is assigned to any users
    const checkQuery = `
      SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?
    `;
    const [checkResult] = await db.query(checkQuery, [id]);

    if (checkResult[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role that is assigned to users'
      });
    }

    const query = `DELETE FROM roles WHERE id = ?`;
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete role',
      message: error.message
    });
  }
});

// GET /api/roles/:id/permissions - ดึง permissions ของ role
router.get('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.module,
        p.action
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.module, p.action
    `;

    const [permissions] = await db.query(query, [id]);

    res.json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role permissions',
      message: error.message
    });
  }
});

// POST /api/roles/:id/permissions - กำหนด permissions ให้ role
router.post('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        error: 'permissionIds must be an array'
      });
    }

    // Remove existing permissions
    await db.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    // Add new permissions
    if (permissionIds.length > 0) {
      const values = permissionIds.map(permissionId => [id, permissionId]);
      const query = 'INSERT INTO role_permissions (role_id, permission_id) VALUES ?';
      await db.query(query, [values]);
    }

    res.json({
      success: true,
      message: 'Role permissions updated successfully'
    });

  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role permissions',
      message: error.message
    });
  }
});

// POST /api/roles/assign - กำหนด role ให้ user
router.post('/assign', async (req, res) => {
  try {
    const { error, value } = assignRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const { userId, roleId } = value;

    // Check if user exists
    const userQuery = 'SELECT id FROM users WHERE id = ?';
    const [users] = await db.query(userQuery, [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if role exists
    const roleQuery = 'SELECT id FROM roles WHERE id = ?';
    const [roles] = await db.query(roleQuery, [roleId]);
    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    // Remove existing role assignments for this user
    await db.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);

    // Assign new role
    const assignQuery = 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)';
    await db.query(assignQuery, [userId, roleId]);

    res.json({
      success: true,
      message: 'Role assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign role',
      message: error.message
    });
  }
});

module.exports = router;
