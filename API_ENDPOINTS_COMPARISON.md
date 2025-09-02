# เปรียบเทียบ API Endpoints: Meter Tree vs อื่นๆ

## 📋 **โครงสร้าง API Endpoints ที่เหมือนกัน**

API endpoints ของ Meter Tree มีโครงสร้างเหมือนกับ API endpoints อื่นๆ ที่ใช้ database บน server แล้ว

## 🔗 **Base URL Structure**

### **Meter Tree API:**
```
Base URL: /api/meter-tree
```

### **Users API:**
```
Base URL: /api/users
```

### **Events API:**
```
Base URL: /api/events
```

## 📊 **เปรียบเทียบโครงสร้าง**

### **1. Database Connection**

#### **Meter Tree (`server/routes/meter-tree.js`):**
```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
```

#### **Users (`server/routes/users.js`):**
```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const db = require('../config/database');

const router = express.Router();
```

#### **Events (`server/routes/events.js`):**
```javascript
const express = require('express');
const db = require('../config/database');

const router = express.Router();
```

### **2. CRUD Operations Pattern**

#### **GET (Read) - เหมือนกันทุก API:**

**Meter Tree:**
```javascript
// Get all locations
router.get('/locations', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM locations ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});
```

**Users:**
```javascript
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
    
    // ... query logic
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
```

**Events:**
```javascript
// GET /api/events - Get events with date range filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      timeFrom = '00:00',
      timeTo = '23:59',
      page = 1,
      limit = 20,
      sortBy = 'timestamp',
      sortOrder = 'DESC',
      search
    } = req.query;
    
    // ... query logic
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});
```

#### **POST (Create) - เหมือนกันทุก API:**

**Meter Tree:**
```javascript
// Create new location
router.post('/locations', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await db.query(
      'INSERT INTO locations (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});
```

**Users:**
```javascript
// POST /api/users - สร้างผู้ใช้ใหม่
router.post('/', async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // ... validation and creation logic
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});
```

#### **PUT (Update) - เหมือนกันทุก API:**

**Meter Tree:**
```javascript
// Update location
router.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      'UPDATE locations SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});
```

**Users:**
```javascript
// PUT /api/users/:id - อัปเดตผู้ใช้
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // ... update logic
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});
```

#### **DELETE (Delete) - เหมือนกันทุก API:**

**Meter Tree:**
```javascript
// Delete location
router.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM locations WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});
```

**Users:**
```javascript
// DELETE /api/users/:id - ลบผู้ใช้
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM users.users WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
```

## 🎯 **Pattern ที่เหมือนกัน**

### **1. Error Handling Pattern:**
```javascript
try {
  // Database operation
  const result = await pool.query(query, params);
  res.json(result.rows);
} catch (error) {
  console.error('Error message:', error);
  res.status(500).json({ error: 'Failed to operation' });
}
```

### **2. Parameter Validation Pattern:**
```javascript
// URL parameters
const { id } = req.params;

// Query parameters
const { search, page, limit, sortBy, sortOrder } = req.query;

// Body parameters
const { name, description } = req.body;
```

### **3. Response Pattern:**
```javascript
// Success response
res.json(result.rows);
res.status(201).json(result.rows[0]);

// Error response
res.status(404).json({ error: 'Not found' });
res.status(500).json({ error: 'Failed to operation' });
```

### **4. Database Query Pattern:**
```javascript
// SELECT
const result = await pool.query('SELECT * FROM table_name WHERE condition');

// INSERT
const result = await pool.query(
  'INSERT INTO table_name (column1, column2) VALUES ($1, $2) RETURNING *',
  [value1, value2]
);

// UPDATE
const result = await pool.query(
  'UPDATE table_name SET column1 = $1 WHERE id = $2 RETURNING *',
  [newValue, id]
);

// DELETE
const result = await pool.query(
  'DELETE FROM table_name WHERE id = $1 RETURNING *',
  [id]
);
```

## 📋 **API Endpoints Summary**

### **Meter Tree API Endpoints:**
```
GET    /api/meter-tree/locations
POST   /api/meter-tree/locations
PUT    /api/meter-tree/locations/:id
DELETE /api/meter-tree/locations/:id

GET    /api/meter-tree/lognets
POST   /api/meter-tree/lognets
PUT    /api/meter-tree/lognets/:id
DELETE /api/meter-tree/lognets/:id

GET    /api/meter-tree/buildings
POST   /api/meter-tree/buildings
PUT    /api/meter-tree/buildings/:id
DELETE /api/meter-tree/buildings/:id

GET    /api/meter-tree/floors
POST   /api/meter-tree/floors
PUT    /api/meter-tree/floors/:id
DELETE /api/meter-tree/floors/:id

GET    /api/meter-tree/meters
POST   /api/meter-tree/meters
PUT    /api/meter-tree/meters/:id
DELETE /api/meter-tree/meters/:id

GET    /api/meter-tree/tree/system
GET    /api/meter-tree/tree/building
GET    /api/meter-tree/tree/online
```

### **Users API Endpoints:**
```
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### **Events API Endpoints:**
```
GET    /api/events
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
```

## ✅ **สรุป**

API endpoints ของ Meter Tree **เหมือนกับ** API endpoints อื่นๆ ที่ใช้ database บน server แล้ว:

1. **✅ โครงสร้างเหมือนกัน**: Express Router + Database Connection
2. **✅ CRUD Pattern เหมือนกัน**: GET, POST, PUT, DELETE
3. **✅ Error Handling เหมือนกัน**: Try-catch + Status codes
4. **✅ Response Format เหมือนกัน**: JSON response
5. **✅ Database Query Pattern เหมือนกัน**: Parameterized queries
6. **✅ Validation Pattern เหมือนกัน**: Parameter extraction
7. **✅ Logging Pattern เหมือนกัน**: Console.error for errors

**Meter Tree API จึงเป็นส่วนหนึ่งของระบบ API ที่มีโครงสร้างเดียวกันทั้งหมด!**
