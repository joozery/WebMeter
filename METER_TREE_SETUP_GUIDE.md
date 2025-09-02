# คู่มือการติดตั้งและใช้งาน Meter Tree Database

## 🚀 **การติดตั้งระบบ**

### **1. ติดตั้ง Database Schema**

รันไฟล์ SQL เพื่อสร้างตารางและข้อมูลตัวอย่าง:

```bash
# เชื่อมต่อ PostgreSQL
psql -U your_username -d your_database

# รัน schema
\i database/meter_tree_schema.sql
```

หรือใช้ pgAdmin เพื่อรันไฟล์ SQL

### **2. ตั้งค่า Environment Variables**

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/`:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=webmeter
DB_PASSWORD=your_password
DB_PORT=5432

# Server Configuration
PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **3. ติดตั้ง Dependencies**

```bash
# ติดตั้ง dependencies สำหรับ server
cd server
npm install

# ติดตั้ง dependencies สำหรับ frontend
cd ..
npm install
```

### **4. รันระบบ**

```bash
# รัน server (Terminal 1)
cd server
npm start

# รัน frontend (Terminal 2)
npm run dev
```

## 📋 **การใช้งาน**

### **1. การสร้าง Location ใหม่**

1. ไปที่หน้า **Meter Tree**
2. เลือก **System Tree** หรือ **Building Tree**
3. กดปุ่ม **Add Location** (ไอคอน +)
4. พิมพ์ชื่อ Location
5. กด **Save**

**ผลลัพธ์:**
- ✅ สร้าง Location ใหม่ใน database
- ✅ แสดงใน tree view
- ✅ ใช้ ID จาก database

### **2. การสร้าง LogNet (System Tree)**

1. คลิกขวาที่ Location
2. เลือก **Add LogNet**
3. กรอกข้อมูล LogNet:
   - Name: ชื่อ LogNet
   - Model: รุ่น
   - Brand: แบรนด์
   - Serial Number: หมายเลขซีเรียล
   - IP Address: ที่อยู่ IP
4. กด **Save**

### **3. การสร้าง Building (Building Tree)**

1. คลิกขวาที่ Location
2. เลือก **Add Building**
3. พิมพ์ชื่อ Building
4. กด **Enter** หรือ **Save**

### **4. การสร้าง Floor (Building Tree)**

1. คลิกขวาที่ Building
2. เลือก **Add Floor**
3. พิมพ์ชื่อ Floor
4. กด **Enter** หรือ **Save**

### **5. การสร้าง Meter**

#### **ใน System Tree:**
1. คลิกขวาที่ LogNet
2. เลือก **Add Meter**
3. กรอกข้อมูล Meter:
   - Name: ชื่อ Meter
   - Brand: แบรนด์
   - Model: รุ่น
   - Serial Number: หมายเลขซีเรียล
   - Protocol: โปรโตคอล
   - IP Address: ที่อยู่ IP
   - Port: พอร์ต
   - CT Primary/Secondary: กระแสปฐมภูมิ/ทุติยภูมิ
   - PT Primary/Secondary: แรงดันปฐมภูมิ/ทุติยภูมิ
4. กด **Save**

#### **ใน Building Tree:**
1. คลิกขวาที่ Floor
2. เลือก **Add Meter**
3. กรอกข้อมูลเหมือน System Tree
4. กด **Save**

### **6. การแก้ไขข้อมูล**

1. **แก้ไขชื่อ:** คลิกที่ชื่อ node แล้วพิมพ์ชื่อใหม่
2. **แก้ไขข้อมูล Meter:** คลิกขวาที่ Meter แล้วเลือก **Properties**

### **7. การลบข้อมูล**

1. **ลบ Child Node:** คลิกขวาที่ node แล้วเลือก **Delete**
2. **ลบ Root Node:** คลิกขวาที่ Location แล้วเลือก **Delete** (จะมี confirmation dialog)

## 🔧 **การแก้ไขปัญหา**

### **1. Database Connection Error**

```bash
# ตรวจสอบการเชื่อมต่อ database
psql -U your_username -d your_database -c "SELECT version();"

# ตรวจสอบ environment variables
echo $DB_USER
echo $DB_HOST
echo $DB_NAME
```

### **2. API Error**

ตรวจสอบ console ใน browser:
```javascript
// ตรวจสอบ API endpoint
fetch('/api/meter-tree/locations')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### **3. Frontend Error**

ตรวจสอบ console ใน browser:
```javascript
// ตรวจสอบ localStorage
console.log(localStorage.getItem('meterTreeRootNodes'));
```

## 📊 **Database Structure**

### **Relationships:**
```
locations (1) → (N) lognets
locations (1) → (N) buildings
buildings (1) → (N) floors
lognets (1) → (N) meters
floors (1) → (N) meters
```

### **Key Fields:**
- **locations**: `id`, `name`, `description`
- **lognets**: `id`, `location_id`, `name`, `model`, `brand`, `ip_address`
- **buildings**: `id`, `location_id`, `name`, `description`
- **floors**: `id`, `building_id`, `name`, `floor_number`
- **meters**: `id`, `name`, `lognet_id`, `floor_id`, `is_active`, `is_disabled_in_building`

## 🎯 **Features ที่รองรับ**

### **✅ System Tree:**
- สร้าง Location → LogNet → Meter
- แก้ไขและลบข้อมูล
- บันทึกลง database

### **✅ Building Tree:**
- สร้าง Location → Building → Floor → Meter
- แก้ไขและลบข้อมูล
- บันทึกลง database

### **✅ Online Tree:**
- กรองเฉพาะ enabled meters
- แสดงจาก Building Tree
- ไม่มีการสร้างข้อมูลใหม่

### **✅ Error Handling:**
- Fallback ไปใช้ localStorage
- แสดง error message
- ระบบยังทำงานได้แม้ database จะมีปัญหา

### **✅ Data Integrity:**
- Foreign key constraints
- Cascade deletes
- Automatic timestamps

## 🔄 **การ Backup และ Restore**

### **Backup Database:**
```bash
pg_dump -U your_username -d your_database > backup.sql
```

### **Restore Database:**
```bash
psql -U your_username -d your_database < backup.sql
```

## 📈 **Performance Tips**

1. **Indexes:** ระบบมี indexes สำหรับ queries ที่ใช้บ่อย
2. **Lazy Loading:** Trees ถูกสร้างเมื่อต้องการ
3. **Caching:** ใช้ localStorage เป็น cache
4. **Error Recovery:** ระบบยังทำงานได้แม้ database จะมีปัญหา

## 🆘 **Support**

หากมีปัญหา:
1. ตรวจสอบ console ใน browser
2. ตรวจสอบ server logs
3. ตรวจสอบ database connection
4. ตรวจสอบ environment variables
