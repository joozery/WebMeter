# ระบบ TableData รองรับ Slave ID

## 📋 **ภาพรวม**

ระบบ TableData ได้รับการปรับปรุงให้สามารถดึงข้อมูลจาก `parameter_db` ตาม `slave_id` ของมิเตอร์ที่เลือกใน sidebar ได้

## 🏗️ **การทำงานของระบบ**

### **1. การเลือกมิเตอร์ใน Sidebar**
- ผู้ใช้สามารถเลือกมิเตอร์ใน sidebar ได้
- ระบบจะแสดง `slave_id` ของแต่ละมิเตอร์ใต้ชื่อมิเตอร์
- สามารถเลือกได้หลายมิเตอร์พร้อมกัน

### **2. การดึงข้อมูลตาม Slave ID**
- เมื่อเลือกมิเตอร์ ระบบจะเก็บ `slave_id` ของมิเตอร์ที่เลือก
- ข้อมูลจะถูกดึงจากตาราง `parameters_value` ใน `parameter_db`
- กรองข้อมูลตาม `slave_id` และช่วงเวลาที่เลือก

### **3. การแสดงผล**
- แสดงข้อมูลในรูปแบบตาราง
- แสดง `slave_id` ในคอลัมน์แรก
- แสดงข้อมูล 39 ค่าทุกๆ 1 นาที

## 🔧 **การติดตั้ง**

### **1. สร้างตาราง parameters_value**
```bash
# เชื่อมต่อไปยัง PostgreSQL
psql -U postgres -h localhost

# สร้าง database ถ้ายังไม่มี
CREATE DATABASE parameters_db;

# เชื่อมต่อไปยัง parameters_db
\c parameters_db;

# รันสคริปต์สร้างตาราง
\i database/create_parameters_value_table.sql
```

### **2. ตรวจสอบการเชื่อมต่อ Database**
ตรวจสอบการตั้งค่าใน `server/routes/table-data.js`:
```javascript
const parametersPool = new Pool({
  host: '192.168.1.175',
  port: 5432,
  database: 'parameters_db',
  user: 'postgres',
  password: 'orangepi123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🚀 **การใช้งาน**

### **1. เข้าถึงหน้า TableData**
- ไปที่เมนู "ตารางข้อมูลย้อนหลัง" ใน navigation
- หรือเข้าผ่าน URL: `/table-data`

### **2. เลือกมิเตอร์**
- ใช้ sidebar ด้านซ้ายเลือกมิเตอร์ที่ต้องการ
- ระบบจะแสดง `slave_id` ของแต่ละมิเตอร์
- สามารถเลือกได้หลายมิเตอร์พร้อมกัน

### **3. ตั้งค่าตัวกรอง**
- **วันที่เริ่มต้น/สิ้นสุด**: เลือกช่วงวันที่ที่ต้องการดึงข้อมูล
- **ช่วงเวลา**: ตั้งเวลาตั้งแต่-ถึง
- **คอลัมน์**: เลือกคอลัมน์ที่ต้องการแสดง

### **4. ดึงข้อมูล**
- กดปุ่ม "ค้นหา" เพื่อเรียกข้อมูลจาก `parameter_db`
- ระบบจะดึงข้อมูลตาม `slave_id` ของมิเตอร์ที่เลือก
- แสดงผลลัพธ์ในรูปแบบตาราง

## 📊 **โครงสร้างข้อมูล**

### **ตาราง parameters_value**
```sql
CREATE TABLE parameters_value (
    id SERIAL PRIMARY KEY,
    reading_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    slave_id INTEGER NOT NULL, -- ระบุว่าข้อมูลมาจากมิเตอร์ไหน
    param_01_freqency DECIMAL(10,2),      -- ความถี่
    param_02_voltage_phase_1 DECIMAL(10,2), -- แรงดันเฟส 1
    param_03_voltage_phase_2 DECIMAL(10,2), -- แรงดันเฟส 2
    param_04_voltage_phase_3 DECIMAL(10,2), -- แรงดันเฟส 3
    param_05_voltage_avg_phase DECIMAL(10,2), -- แรงดันเฉลี่ยเฟส
    param_06_voltage_line_1_2 DECIMAL(10,2), -- แรงดันไลน์ 1-2
    param_07_voltage_line_2_3 DECIMAL(10,2), -- แรงดันไลน์ 2-3
    param_08_voltage_line_3_1 DECIMAL(10,2), -- แรงดันไลน์ 3-1
    param_09_voltage_avg_line DECIMAL(10,2), -- แรงดันเฉลี่ยไลน์
    param_10_current_phase_a DECIMAL(10,3), -- กระแสเฟส A
    param_11_current_phase_b DECIMAL(10,3), -- กระแสเฟส B
    param_12_current_phase_c DECIMAL(10,3), -- กระแสเฟส C
    param_13_current_avg_phase DECIMAL(10,3), -- กระแสเฉลี่ยเฟส
    param_14_current_neutral DECIMAL(10,3), -- กระแสนิวทรัล
    param_15_power_phase_a DECIMAL(12,5), -- กำลังไฟฟ้าเฟส A
    param_16_power_phase_b DECIMAL(12,5), -- กำลังไฟฟ้าเฟส B
    param_17_power_phase_c DECIMAL(12,5), -- กำลังไฟฟ้าเฟส C
    param_18_power_total_system DECIMAL(12,5), -- กำลังไฟฟ้ารวมระบบ
    param_19_reactive_power_phase_a DECIMAL(12,5), -- กำลังไฟฟ้ารีแอคทีฟเฟส A
    param_20_reactive_power_phase_b DECIMAL(12,5), -- กำลังไฟฟ้ารีแอคทีฟเฟส B
    param_21_reactive_power_phase_c DECIMAL(12,5), -- กำลังไฟฟ้ารีแอคทีฟเฟส C
    param_22_reactive_power_total DECIMAL(12,5), -- กำลังไฟฟ้ารีแอคทีฟรวม
    param_23_apparent_power_phase_a DECIMAL(12,5), -- กำลังไฟฟ้าปรากฏเฟส A
    param_24_apparent_power_phase_b DECIMAL(12,5), -- กำลังไฟฟ้าปรากฏเฟส B
    param_25_apparent_power_phase_c DECIMAL(12,5), -- กำลังไฟฟ้าปรากฏเฟส C
    param_26_apparent_power_total DECIMAL(12,5), -- กำลังไฟฟ้าปรากฏรวม
    param_27_power_factor_phase_a DECIMAL(5,3), -- แฟกเตอร์กำลังเฟส A
    param_28_power_factor_phase_b DECIMAL(5,3), -- แฟกเตอร์กำลังเฟส B
    param_29_power_factor_phase_c DECIMAL(5,3), -- แฟกเตอร์กำลังเฟส C
    param_30_power_factor_total DECIMAL(5,3), -- แฟกเตอร์กำลังรวม
    param_31_power_demand DECIMAL(10,2), -- ดีมานด์กำลังไฟฟ้า
    param_32_reactive_power_demand DECIMAL(10,2), -- ดีมานด์กำลังไฟฟ้ารีแอคทีฟ
    param_33_apparent_power_demand DECIMAL(10,2), -- ดีมานด์กำลังไฟฟ้าปรากฏ
    param_34_import_kwh DECIMAL(12,2), -- พลังงานไฟฟ้านำเข้า (kWh)
    param_35_export_kwh DECIMAL(12,2), -- พลังงานไฟฟ้าส่งออก (kWh)
    param_36_import_kvarh DECIMAL(12,2), -- พลังงานไฟฟ้ารีแอคทีฟนำเข้า (kVarh)
    param_37_export_kvarh DECIMAL(12,2), -- พลังงานไฟฟ้ารีแอคทีฟส่งออก (kVarh)
    param_38_thdv DECIMAL(5,2), -- THDV (Total Harmonic Distortion Voltage)
    param_39_thdi DECIMAL(5,2), -- THDI (Total Harmonic Distortion Current)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 **API Endpoints**

### **GET /api/table-data**
ดึงข้อมูลจาก `parameter_db` ตาม `slave_id`

**Parameters:**
- `dateFrom`: วันที่เริ่มต้น (YYYY-MM-DD)
- `dateTo`: วันที่สิ้นสุด (YYYY-MM-DD)
- `timeFrom`: เวลาเริ่มต้น (HH:MM)
- `timeTo`: เวลาสิ้นสุด (HH:MM)
- `slaveIds`: รายการ slave_id (array)
- `columns`: รายการคอลัมน์ที่ต้องการ (array)
- `interval`: ช่วงเวลา ('1' หรือ '15')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "time": "2025-01-07T00:00:00+07:00",
      "slave_id": 1,
      "Frequency": 50.01,
      "Volt AN": 220.5,
      "Current A": 5.12,
      "Watt Total": 3375.7
    }
  ],
  "count": 60,
  "columns": ["Frequency", "Volt AN", "Current A", "Watt Total"],
  "dateRange": {
    "from": "2025-01-07 00:00:00",
    "to": "2025-01-07 23:59:00"
  }
}
```

## 📁 **ไฟล์ที่เกี่ยวข้อง**

### **Backend**
- `server/routes/table-data.js` - API endpoint สำหรับดึงข้อมูล
- `database/create_parameters_value_table.sql` - สคริปต์สร้างตาราง

### **Frontend**
- `src/pages/TableData.tsx` - หน้าหลักสำหรับแสดงข้อมูล
- `src/services/api.ts` - Service สำหรับเรียก API
- `src/components/ui/sidebar-menu.tsx` - Sidebar สำหรับเลือกมิเตอร์

## 🔍 **การแก้ไขปัญหา**

### **ปัญหาที่พบบ่อย**

1. **ไม่สามารถเชื่อมต่อ database ได้**
   - ตรวจสอบการตั้งค่าการเชื่อมต่อ
   - ตรวจสอบว่า database และตารางถูกสร้างแล้ว

2. **ไม่พบข้อมูล**
   - ตรวจสอบว่ามีข้อมูลในตาราง `parameters_value`
   - ตรวจสอบ `slave_id` ที่เลือกตรงกับข้อมูลใน database

3. **Sidebar ไม่แสดงมิเตอร์**
   - ตรวจสอบว่ามีข้อมูลมิเตอร์ใน `webmeter_db`
   - ตรวจสอบว่า `slave_id` ถูกตั้งค่าในตาราง `meters`

## 📈 **ประสิทธิภาพ**

### **Indexes ที่แนะนำ**
```sql
CREATE INDEX idx_parameters_value_reading_timestamp ON parameters_value(reading_timestamp);
CREATE INDEX idx_parameters_value_slave_id ON parameters_value(slave_id);
CREATE INDEX idx_parameters_value_timestamp_slave ON parameters_value(reading_timestamp, slave_id);
```

### **การปรับแต่ง Query**
- ใช้ `slave_id = ANY($3)` สำหรับการกรองหลาย slave_id
- ใช้ `EXTRACT(MINUTE FROM reading_timestamp) % 15 = 0` สำหรับข้อมูลทุก 15 นาที

---

**หมายเหตุ**: ระบบนี้ถูกออกแบบมาเพื่อรองรับข้อมูลจำนวนมากและสามารถขยายได้ตามความต้องการในอนาคต
