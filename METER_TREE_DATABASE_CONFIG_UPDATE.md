# การอัปเดต Database Configuration: Meter Tree API

## 🔄 **การเปลี่ยนแปลง**

### **ก่อนการอัปเดต:**
```javascript
// server/routes/meter-tree.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'webmeter',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});
```

### **หลังการอัปเดต:**
```javascript
// server/routes/meter-tree.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
```

## ✅ **ผลลัพธ์**

### **1. ใช้ Database Configuration เดียวกัน**
- **Meter Tree API**: ใช้ `db` จาก `../config/database`
- **Users API**: ใช้ `db` จาก `../config/database`
- **Events API**: ใช้ `db` จาก `../config/database`

### **2. Database Configuration ที่ใช้ร่วมกัน**
```javascript
// server/config/database.js
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.1.175',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'webmeter_db',
  user: process.env.DB_USER || 'webmeter_app',
  password: process.env.DB_PASSWORD || 'WebMeter2024!',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
```

### **3. การเรียกใช้ Database Query**
```javascript
// ก่อน: ใช้ pool.query
const result = await pool.query('SELECT * FROM locations');

// หลัง: ใช้ db.query
const result = await db.query('SELECT * FROM locations');
```

## 🎯 **ประโยชน์**

### **1. ความสม่ำเสมอ (Consistency)**
- ✅ ทุก API endpoints ใช้ database configuration เดียวกัน
- ✅ การจัดการ connection pool เป็นมาตรฐานเดียวกัน
- ✅ Environment variables ใช้ร่วมกัน

### **2. การบำรุงรักษา (Maintainability)**
- ✅ แก้ไข database configuration ที่เดียว
- ✅ ไม่ต้องแก้ไขหลายไฟล์เมื่อเปลี่ยน database settings
- ✅ ลดความซ้ำซ้อนของ code

### **3. ความปลอดภัย (Security)**
- ✅ Database credentials อยู่ที่เดียว
- ✅ การจัดการ environment variables เป็นมาตรฐาน
- ✅ Connection pooling ที่เหมาะสม

### **4. ประสิทธิภาพ (Performance)**
- ✅ ใช้ connection pool ร่วมกัน
- ✅ การจัดการ connection ที่เหมาะสม
- ✅ ลดการสร้าง connection ใหม่

## 📋 **API Endpoints ที่อัปเดต**

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

## 🔧 **การตรวจสอบ**

### **1. ตรวจสอบ Database Connection**
```bash
# ตรวจสอบ server logs
cd server
npm start

# ควรเห็น:
# 🔍 Database Configuration:
# DB_HOST: 192.168.1.175
# DB_USER: webmeter_app
# DB_NAME: webmeter_db
# DB_PASSWORD: ***
# ✅ Connected to PostgreSQL database
```

### **2. ตรวจสอบ API Endpoints**
```bash
# ทดสอบ Meter Tree API
curl http://localhost:3001/api/meter-tree/locations

# ควรได้ response:
# []
```

### **3. ตรวจสอบ Error Handling**
```bash
# ทดสอบ error case
curl -X POST http://localhost:3001/api/meter-tree/locations \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Location"}'

# ควรได้ response:
# {"id": 1, "name": "Test Location", "description": null, ...}
```

## ✅ **สรุป**

**Meter Tree API ได้รับการอัปเดตให้ใช้ database configuration เดียวกันกับ API endpoints อื่นๆ แล้ว:**

1. **✅ ใช้ `config/database.js`** แทนการสร้าง Pool ใหม่
2. **✅ ใช้ `db.query()`** แทน `pool.query()`
3. **✅ Database settings** เป็นมาตรฐานเดียวกัน
4. **✅ Connection pooling** ใช้ร่วมกัน
5. **✅ Environment variables** ใช้ร่วมกัน

**ตอนนี้ Meter Tree API มีโครงสร้างเหมือนกับ API endpoints อื่นๆ อย่างสมบูรณ์!** 🚀
