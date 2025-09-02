-- Create Permissions System Tables
-- สร้างตารางสำหรับระบบสิทธิ์การใช้งาน

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  module VARCHAR(50) NOT NULL, -- เช่น 'users', 'dashboard', 'meter-tree'
  action VARCHAR(50) NOT NULL, -- เช่น 'read', 'write', 'delete', 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Create role_permissions table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- 4. Create user_roles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('Super Admin', 'ผู้ดูแลระบบสูงสุด - มีสิทธิ์ทุกอย่าง'),
('Admin', 'ผู้ดูแลระบบ - จัดการผู้ใช้และระบบ'),
('Manager', 'ผู้จัดการ - ดูข้อมูลและจัดการทีม'),
('Supervisor', 'หัวหน้างาน - ดูแลและตรวจสอบงาน'),
('Engineer', 'วิศวกร - วิเคราะห์และแก้ไขปัญหา'),
('Operator', 'ผู้ปฏิบัติงาน - ดูข้อมูลและรายงาน');

-- Insert default permissions
INSERT INTO permissions (name, description, module, action) VALUES
-- User Management
('users.read', 'ดูรายชื่อผู้ใช้', 'users', 'read'),
('users.write', 'เพิ่ม/แก้ไขผู้ใช้', 'users', 'write'),
('users.delete', 'ลบผู้ใช้', 'users', 'delete'),
('users.admin', 'จัดการสิทธิ์ผู้ใช้', 'users', 'admin'),

-- Dashboard
('dashboard.read', 'ดูข้อมูล Dashboard', 'dashboard', 'read'),
('dashboard.write', 'แก้ไขการตั้งค่า Dashboard', 'dashboard', 'write'),
('dashboard.admin', 'จัดการ Dashboard', 'dashboard', 'admin'),

-- Meter Tree
('meter-tree.read', 'ดูโครงสร้างมิเตอร์', 'meter-tree', 'read'),
('meter-tree.write', 'แก้ไขโครงสร้างมิเตอร์', 'meter-tree', 'write'),
('meter-tree.delete', 'ลบโครงสร้างมิเตอร์', 'meter-tree', 'delete'),
('meter-tree.admin', 'จัดการโครงสร้างมิเตอร์', 'meter-tree', 'admin'),

-- Data Management
('data.read', 'ดูข้อมูลมิเตอร์', 'data', 'read'),
('data.write', 'เพิ่ม/แก้ไขข้อมูลมิเตอร์', 'data', 'write'),
('data.delete', 'ลบข้อมูลมิเตอร์', 'data', 'delete'),
('data.export', 'ส่งออกข้อมูล', 'data', 'export'),

-- Reports
('reports.read', 'ดูรายงาน', 'reports', 'read'),
('reports.write', 'สร้างรายงาน', 'reports', 'write'),
('reports.admin', 'จัดการรายงาน', 'reports', 'admin'),

-- System Settings
('settings.read', 'ดูการตั้งค่าระบบ', 'settings', 'read'),
('settings.write', 'แก้ไขการตั้งค่าระบบ', 'settings', 'write'),
('settings.admin', 'จัดการการตั้งค่าระบบ', 'settings', 'admin');

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Admin gets most permissions except system settings admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE module != 'settings' OR action != 'admin';

-- Manager gets read permissions and some write permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE action IN ('read') 
   OR (module = 'dashboard' AND action = 'write')
   OR (module = 'reports' AND action = 'write');

-- Supervisor gets read permissions and data management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions 
WHERE action IN ('read') 
   OR (module = 'data' AND action IN ('write', 'export'))
   OR (module = 'reports' AND action = 'write');

-- Engineer gets read permissions and data management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions 
WHERE action IN ('read') 
   OR (module = 'data' AND action IN ('write', 'export'))
   OR (module = 'meter-tree' AND action = 'write');

-- Operator gets only read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions 
WHERE action = 'read';

-- Assign default roles to existing users (optional)
-- You can run this after creating the tables
-- INSERT INTO user_roles (user_id, role_id) VALUES (1, 1); -- First user as Super Admin

