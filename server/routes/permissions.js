const express = require('express');
const Joi = require('joi');
const db = require('../config/database');

const router = express.Router();

// Validation schemas
const permissionSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow('', null),
  module: Joi.string().min(2).max(50).required(),
  action: Joi.string().min(2).max(50).required()
});

// GET /api/permissions - ดึงรายชื่อ permissions ทั้งหมด
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.module,
        p.action,
        p.created_at,
        p.updated_at,
        COUNT(rp.role_id) as role_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      GROUP BY p.id
      ORDER BY p.module, p.action
    `;

    const [permissions] = await db.query(query);

    res.json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions',
      message: error.message
    });
  }
});

// GET /api/permissions/:id - ดึงข้อมูล permission ตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.module,
        p.action,
        p.created_at,
        p.updated_at
      FROM permissions p
      WHERE p.id = ?
    `;

    const [permissions] = await db.query(query, [id]);

    if (permissions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found'
      });
    }

    res.json({
      success: true,
      data: permissions[0]
    });

  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permission',
      message: error.message
    });
  }
});

// POST /api/permissions - สร้าง permission ใหม่
router.post('/', async (req, res) => {
  try {
    const { error, value } = permissionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const { name, description, module, action } = value;

    const query = `
      INSERT INTO permissions (name, description, module, action)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [name, description, module, action]);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        description,
        module,
        action,
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create permission',
      message: error.message
    });
  }
});

// PUT /api/permissions/:id - อัปเดต permission
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = permissionSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const { name, description, module, action } = value;

    const query = `
      UPDATE permissions 
      SET name = ?, description = ?, module = ?, action = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await db.query(query, [name, description, module, action, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: parseInt(id),
        name,
        description,
        module,
        action,
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update permission',
      message: error.message
    });
  }
});

// DELETE /api/permissions/:id - ลบ permission
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permission is assigned to any roles
    const checkQuery = `
      SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = ?
    `;
    const [checkResult] = await db.query(checkQuery, [id]);

    if (checkResult[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete permission that is assigned to roles'
      });
    }

    const query = `DELETE FROM permissions WHERE id = ?`;
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found'
      });
    }

    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete permission',
      message: error.message
    });
  }
});

// GET /api/permissions/modules - ดึงรายชื่อ modules ทั้งหมด
router.get('/modules/list', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT module
      FROM permissions
      ORDER BY module
    `;

    const [modules] = await db.query(query);

    res.json({
      success: true,
      data: modules.map(row => row.module)
    });

  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modules',
      message: error.message
    });
  }
});

// GET /api/permissions/actions - ดึงรายชื่อ actions ทั้งหมด
router.get('/actions/list', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT action
      FROM permissions
      ORDER BY action
    `;

    const [actions] = await db.query(query);

    res.json({
      success: true,
      data: actions.map(row => row.action)
    });

  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch actions',
      message: error.message
    });
  }
});

// GET /api/permissions/module/:module - ดึง permissions ตาม module
router.get('/module/:module', async (req, res) => {
  try {
    const { module } = req.params;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.module,
        p.action,
        p.created_at,
        p.updated_at
      FROM permissions p
      WHERE p.module = ?
      ORDER BY p.action
    `;

    const [permissions] = await db.query(query, [module]);

    res.json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error('Error fetching module permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module permissions',
      message: error.message
    });
  }
});

module.exports = router;

