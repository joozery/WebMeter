const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware สำหรับตรวจสอบ JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Middleware สำหรับตรวจสอบสิทธิ์การใช้งาน
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const userId = req.user.userId;

      // ดึง permissions ของ user
      const query = `
        SELECT DISTINCT p.name as permission_name
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
      `;

      const [permissions] = await db.query(query, [userId]);
      const userPermissions = permissions.map(p => p.permission_name);

      // ตรวจสอบว่ามีสิทธิ์ที่ต้องการหรือไม่
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: requiredPermission,
          userPermissions: userPermissions
        });
      }

      next();

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

// Middleware สำหรับตรวจสอบสิทธิ์หลายสิทธิ์ (OR logic)
const checkAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const userId = req.user.userId;

      // ดึง permissions ของ user
      const query = `
        SELECT DISTINCT p.name as permission_name
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
      `;

      const [permissions] = await db.query(query, [userId]);
      const userPermissions = permissions.map(p => p.permission_name);

      // ตรวจสอบว่ามีสิทธิ์ใดสิทธิ์หนึ่งที่ต้องการหรือไม่
      const hasAnyPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: requiredPermissions,
          userPermissions: userPermissions
        });
      }

      next();

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

// Middleware สำหรับตรวจสอบสิทธิ์หลายสิทธิ์ (AND logic)
const checkAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const userId = req.user.userId;

      // ดึง permissions ของ user
      const query = `
        SELECT DISTINCT p.name as permission_name
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
      `;

      const [permissions] = await db.query(query, [userId]);
      const userPermissions = permissions.map(p => p.permission_name);

      // ตรวจสอบว่ามีสิทธิ์ทั้งหมดที่ต้องการหรือไม่
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: requiredPermissions,
          userPermissions: userPermissions
        });
      }

      next();

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

// Helper function สำหรับดึง user permissions
const getUserPermissions = async (userId) => {
  try {
    const query = `
      SELECT DISTINCT p.name as permission_name, p.module, p.action
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY p.module, p.action
    `;

    const [permissions] = await db.query(query, [userId]);
    return permissions;

  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

// Helper function สำหรับดึง user roles
const getUserRoles = async (userId) => {
  try {
    const query = `
      SELECT r.id, r.name, r.description
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `;

    const [roles] = await db.query(query, [userId]);
    return roles;

  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
};

module.exports = {
  authenticateToken,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  getUserPermissions,
  getUserRoles
};

