# 🔐 Permissions System Guide
## คู่มือการใช้งานระบบสิทธิ์การใช้งาน

## 📋 **ภาพรวมระบบ**

ระบบ Permissions System ประกอบด้วย 3 ส่วนหลัก:
1. **Roles (บทบาท)** - กำหนดบทบาทของผู้ใช้
2. **Permissions (สิทธิ์)** - กำหนดสิทธิ์การใช้งาน
3. **User-Role Assignment** - เชื่อมโยงผู้ใช้กับบทบาท

---

## 🏗️ **โครงสร้างฐานข้อมูล**

### **1. ตาราง roles**
```sql
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **2. ตาราง permissions**
```sql
CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  module VARCHAR(50) NOT NULL, -- เช่น 'users', 'dashboard', 'meter-tree'
  action VARCHAR(50) NOT NULL, -- เช่น 'read', 'write', 'delete', 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **3. ตาราง role_permissions (Many-to-Many)**
```sql
CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
);
```

### **4. ตาราง user_roles (Many-to-Many)**
```sql
CREATE TABLE user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role_id)
);
```

---

## 👥 **บทบาท (Roles) ที่มีอยู่**

| ID | Name | Description | สิทธิ์หลัก |
|---|---|---|---|
| 1 | admin | System Administrator | จัดการระบบทั้งหมด |
| 2 | supervisor | Supervisor/Manager | ดูแลและตรวจสอบงาน |
| 3 | operator | Operator/User | ผู้ปฏิบัติงาน |
| 4 | viewer | Read-only User | ดูข้อมูลเท่านั้น |
| 19 | Super Admin | ผู้ดูแลระบบสูงสุด | มีสิทธิ์ทุกอย่าง |
| 20 | Manager | ผู้จัดการ | ดูข้อมูลและจัดการทีม |
| 21 | Engineer | วิศวกร | วิเคราะห์และแก้ไขปัญหา |

---

## 🔑 **สิทธิ์ (Permissions) ที่มีอยู่**

### **User Management**
- `users.read` - ดูรายชื่อผู้ใช้
- `users.write` - เพิ่ม/แก้ไขผู้ใช้
- `users.delete` - ลบผู้ใช้
- `users.admin` - จัดการสิทธิ์ผู้ใช้

### **Dashboard**
- `dashboard.read` - ดูข้อมูล Dashboard
- `dashboard.write` - แก้ไขการตั้งค่า Dashboard
- `dashboard.admin` - จัดการ Dashboard

### **Meter Tree**
- `meter-tree.read` - ดูโครงสร้างมิเตอร์
- `meter-tree.write` - แก้ไขโครงสร้างมิเตอร์
- `meter-tree.delete` - ลบโครงสร้างมิเตอร์
- `meter-tree.admin` - จัดการโครงสร้างมิเตอร์

### **Data Management**
- `data.read` - ดูข้อมูลมิเตอร์
- `data.write` - เพิ่ม/แก้ไขข้อมูลมิเตอร์
- `data.delete` - ลบข้อมูลมิเตอร์
- `data.export` - ส่งออกข้อมูล

### **Reports**
- `reports.read` - ดูรายงาน
- `reports.write` - สร้างรายงาน
- `reports.admin` - จัดการรายงาน

### **System Settings**
- `settings.read` - ดูการตั้งค่าระบบ
- `settings.write` - แก้ไขการตั้งค่าระบบ
- `settings.admin` - จัดการการตั้งค่าระบบ

---

## 🚀 **API Endpoints**

### **Roles API**
```bash
# ดึงรายชื่อ roles ทั้งหมด
GET /api/roles

# ดึงข้อมูล role ตาม ID
GET /api/roles/:id

# สร้าง role ใหม่
POST /api/roles
{
  "name": "New Role",
  "description": "Description"
}

# อัปเดต role
PUT /api/roles/:id
{
  "name": "Updated Role",
  "description": "Updated Description"
}

# ลบ role
DELETE /api/roles/:id

# ดึง permissions ของ role
GET /api/roles/:id/permissions

# กำหนด permissions ให้ role
POST /api/roles/:id/permissions
{
  "permissionIds": [1, 2, 3]
}

# กำหนด role ให้ user
POST /api/roles/assign
{
  "userId": 1,
  "roleId": 2
}
```

### **Permissions API**
```bash
# ดึงรายชื่อ permissions ทั้งหมด
GET /api/permissions

# ดึงข้อมูล permission ตาม ID
GET /api/permissions/:id

# สร้าง permission ใหม่
POST /api/permissions
{
  "name": "new.permission",
  "description": "Description",
  "module": "users",
  "action": "read"
}

# อัปเดต permission
PUT /api/permissions/:id
{
  "name": "updated.permission",
  "description": "Updated Description",
  "module": "users",
  "action": "write"
}

# ลบ permission
DELETE /api/permissions/:id

# ดึงรายชื่อ modules ทั้งหมด
GET /api/permissions/modules/list

# ดึงรายชื่อ actions ทั้งหมด
GET /api/permissions/actions/list

# ดึง permissions ตาม module
GET /api/permissions/module/:module
```

---

## 🛡️ **Middleware สำหรับตรวจสอบสิทธิ์**

### **1. authenticateToken**
ตรวจสอบ JWT token
```javascript
const { authenticateToken } = require('../middleware/auth');
app.use('/api/protected', authenticateToken);
```

### **2. checkPermission**
ตรวจสอบสิทธิ์เดียว
```javascript
const { checkPermission } = require('../middleware/auth');
app.get('/api/users', checkPermission('users.read'));
```

### **3. checkAnyPermission**
ตรวจสอบสิทธิ์หลายสิทธิ์ (OR logic)
```javascript
const { checkAnyPermission } = require('../middleware/auth');
app.post('/api/users', checkAnyPermission(['users.write', 'users.admin']));
```

### **4. checkAllPermissions**
ตรวจสอบสิทธิ์หลายสิทธิ์ (AND logic)
```javascript
const { checkAllPermissions } = require('../middleware/auth');
app.delete('/api/users/:id', checkAllPermissions(['users.delete', 'users.admin']));
```

---

## 💻 **การใช้งานใน Frontend**

### **1. Import API functions**
```typescript
import { roles, permissions } from '@/services/api';
```

### **2. ดึงข้อมูล roles**
```typescript
const fetchRoles = async () => {
  try {
    const response = await roles.getAll();
    if (response.success) {
      setUserRoles(response.data);
    }
  } catch (error) {
    console.error('Failed to fetch roles:', error);
  }
};
```

### **3. ดึงข้อมูล permissions**
```typescript
const fetchPermissions = async () => {
  try {
    const response = await permissions.getAll();
    if (response.success) {
      setPermissions(response.data);
    }
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
  }
};
```

### **4. กำหนด role ให้ user**
```typescript
const assignRole = async (userId: number, roleId: number) => {
  try {
    const response = await roles.assignToUser(userId, roleId);
    if (response.success) {
      showSuccess('Role assigned successfully');
    }
  } catch (error) {
    console.error('Failed to assign role:', error);
  }
};
```

---

## 🔧 **การตั้งค่าเริ่มต้น**

### **1. สร้างตารางและข้อมูลเริ่มต้น**
```bash
mysql -h 145.223.21.117 -u debian-sys-maint -p'Str0ngP@ssw0rd!' webmeter_db < database/update_roles_and_permissions.sql
```

### **2. กำหนด role ให้ user แรก**
```sql
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1); -- User ID 1 เป็น Admin
```

### **3. ตรวจสอบการทำงาน**
```bash
# ทดสอบ API
curl -X GET "http://localhost:2001/api/roles"
curl -X GET "http://localhost:2001/api/permissions"
curl -X GET "http://localhost:2001/api/roles/1/permissions"
```

---

## 📝 **ตัวอย่างการใช้งาน**

### **1. สร้าง Role ใหม่**
```javascript
const newRole = await roles.create({
  name: "Data Analyst",
  description: "วิเคราะห์ข้อมูลและสร้างรายงาน"
});
```

### **2. สร้าง Permission ใหม่**
```javascript
const newPermission = await permissions.create({
  name: "data.analyze",
  description: "วิเคราะห์ข้อมูล",
  module: "data",
  action: "analyze"
});
```

### **3. กำหนด Permissions ให้ Role**
```javascript
await roles.updatePermissions(roleId, [1, 2, 3, 4]); // permission IDs
```

### **4. กำหนด Role ให้ User**
```javascript
await roles.assignToUser(userId, roleId);
```

---

## ⚠️ **ข้อควรระวัง**

1. **ไม่ลบ Role ที่มี User ใช้งานอยู่**
2. **ไม่ลบ Permission ที่มี Role ใช้งานอยู่**
3. **ตรวจสอบสิทธิ์ก่อนใช้งาน API**
4. **ใช้ Middleware ในการป้องกัน**
5. **บันทึก Log การเปลี่ยนแปลงสิทธิ์**

---

## 🎯 **ขั้นตอนต่อไป**

1. **สร้างหน้า Role Management** ใน Frontend
2. **สร้างหน้า Permission Management** ใน Frontend
3. **เพิ่ม Middleware ใน API Routes**
4. **สร้างระบบ Audit Log**
5. **เพิ่มการแจ้งเตือนเมื่อมีการเปลี่ยนแปลงสิทธิ์**

---

## 📞 **การสนับสนุน**

หากมีปัญหาหรือคำถามเกี่ยวกับระบบ Permissions สามารถติดต่อทีมพัฒนาได้

