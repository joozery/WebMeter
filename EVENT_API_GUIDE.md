# Event API Integration Guide

## ภาพรวม

Event API ถูกออกแบบมาเพื่อดึงข้อมูล event logs จากตาราง `event` ในฐานข้อมูล `webmeter_db` โดยมีฟีเจอร์การกรองตามช่วงวันที่เวลา การค้นหา และการแบ่งหน้า

## ตารางฐานข้อมูล

### ตาราง `event`

```sql
CREATE TABLE event (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(100) NOT NULL,
    lognet VARCHAR(50),
    ip VARCHAR(45) NOT NULL,
    event TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**คอลัมน์:**
- `id`: Primary key
- `timestamp`: เวลาที่เกิด event
- `username`: ชื่อผู้ใช้ที่ทำ event
- `lognet`: IP address ของ lognet
- `ip`: IP address ของ client
- `event`: รายละเอียดของ event
- `created_at`: เวลาที่สร้าง record

## API Endpoints

### 1. GET /api/events

ดึงข้อมูล events พร้อมการกรองและแบ่งหน้า

**Parameters:**
- `dateFrom` (required): วันที่เริ่มต้น (YYYY-MM-DD)
- `dateTo` (required): วันที่สิ้นสุด (YYYY-MM-DD)
- `timeFrom` (optional): เวลาเริ่มต้น (HH:MM) - default: 00:00
- `timeTo` (optional): เวลาสิ้นสุด (HH:MM) - default: 23:59
- `page` (optional): หน้าปัจจุบัน - default: 1
- `limit` (optional): จำนวน records ต่อหน้า - default: 20
- `sortBy` (optional): ฟิลด์สำหรับเรียงลำดับ - default: timestamp
- `sortOrder` (optional): ลำดับการเรียง (ASC/DESC) - default: DESC
- `search` (optional): คำค้นหาใน username, ip, lognet, event

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "no": 100,
      "time": "09:30:15 15 Jan 2024",
      "username": "admin",
      "ip": "192.168.1.100",
      "lognetIp": "10.0.0.1",
      "event": "User login successful",
      "id": 1,
      "timestamp": "2024-01-15T09:30:15.000Z",
      "created_at": "2024-01-15T09:30:15.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "dateRange": {
    "from": "2024-01-15 00:00",
    "to": "2024-01-15 23:59"
  }
}
```

### 2. GET /api/events/date-range

ดึงช่วงวันที่ที่มีข้อมูล events

**Response:**
```json
{
  "success": true,
  "dateRange": {
    "min_date": "09:30:15 15 Jan 2024",
    "max_date": "23:45:18 16 Jan 2024"
  }
}
```

### 3. GET /api/events/stats

ดึงสถิติของ events ในช่วงวันที่ที่กำหนด

**Parameters:**
- `dateFrom` (required): วันที่เริ่มต้น (YYYY-MM-DD)
- `dateTo` (required): วันที่สิ้นสุด (YYYY-MM-DD)
- `timeFrom` (optional): เวลาเริ่มต้น (HH:MM)
- `timeTo` (optional): เวลาสิ้นสุด (HH:MM)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 150,
    "uniqueUsers": 4,
    "uniqueIPs": 3,
    "uniqueEventTypes": 25
  }
}
```

## การใช้งานใน Frontend

### 1. Import API Client

```typescript
import { apiClient, type Event, type EventFilters } from '@/services/api';
```

### 2. ดึงข้อมูล Events

```typescript
const loadEvents = async () => {
  const filters: EventFilters = {
    dateFrom: '2024-01-15',
    dateTo: '2024-01-16',
    timeFrom: '00:00',
    timeTo: '23:59',
    page: 1,
    limit: 20,
    sortBy: 'timestamp',
    sortOrder: 'DESC',
    search: 'admin'
  };

  const response = await apiClient.getEvents(filters);
  
  if (response.success && response.data) {
    setEvents(response.data.data);
    setTotalPages(response.data.pagination.totalPages);
    setTotalRecords(response.data.pagination.total);
  }
};
```

### 3. ดึงช่วงวันที่

```typescript
const loadDateRange = async () => {
  const response = await apiClient.getEventDateRange();
  
  if (response.success && response.data) {
    setMinDate(response.data.dateRange.min_date);
    setMaxDate(response.data.dateRange.max_date);
  }
};
```

### 4. ดึงสถิติ

```typescript
const loadStats = async () => {
  const response = await apiClient.getEventStats({
    dateFrom: '2024-01-15',
    dateTo: '2024-01-16'
  });
  
  if (response.success && response.data) {
    setStats(response.data);
  }
};
```

## การติดตั้ง

### 1. รัน SQL Script

```bash
psql -U postgres -d webmeter_db -f database/create_event_table.sql
```

### 2. ตรวจสอบ Server Configuration

ตรวจสอบว่า server มีการตั้งค่าฐานข้อมูลที่ถูกต้องใน `server/config/database.js`

### 3. รีสตาร์ท Server

```bash
cd server
npm start
```

## ฟีเจอร์ที่รองรับ

### การกรองข้อมูล
- **ช่วงวันที่**: เลือกวันที่เริ่มต้นและสิ้นสุด
- **ช่วงเวลา**: เลือกเวลาเริ่มต้นและสิ้นสุด
- **การค้นหา**: ค้นหาใน username, ip, lognet, event

### การเรียงลำดับ
- เรียงตามฟิลด์: id, timestamp, username, ip, lognet, event
- ลำดับ: ASC (น้อยไปมาก), DESC (มากไปน้อย)

### การแบ่งหน้า
- กำหนดจำนวน records ต่อหน้า
- แสดงข้อมูลการแบ่งหน้า (หน้าปัจจุบัน, หน้าทั้งหมด, จำนวน records)

### การแสดงผล
- แสดงสถานะการโหลด
- แสดงข้อความเมื่อไม่มีข้อมูล
- แสดงข้อผิดพลาดเมื่อเกิดปัญหา

## ตัวอย่างการใช้งาน

### ตัวอย่าง 1: ดึง Events ของวันนี้

```typescript
const today = new Date();
const filters: EventFilters = {
  dateFrom: format(today, 'yyyy-MM-dd'),
  dateTo: format(today, 'yyyy-MM-dd'),
  timeFrom: '00:00',
  timeTo: '23:59',
  sortBy: 'timestamp',
  sortOrder: 'DESC'
};

const response = await apiClient.getEvents(filters);
```

### ตัวอย่าง 2: ค้นหา Events ของผู้ใช้ admin

```typescript
const filters: EventFilters = {
  dateFrom: '2024-01-15',
  dateTo: '2024-01-16',
  search: 'admin',
  sortBy: 'timestamp',
  sortOrder: 'DESC'
};

const response = await apiClient.getEvents(filters);
```

### ตัวอย่าง 3: ดึง Events ในช่วงเวลาทำงาน

```typescript
const filters: EventFilters = {
  dateFrom: '2024-01-15',
  dateTo: '2024-01-15',
  timeFrom: '08:00',
  timeTo: '17:00',
  sortBy: 'timestamp',
  sortOrder: 'ASC'
};

const response = await apiClient.getEvents(filters);
```

## การจัดการข้อผิดพลาด

API จะส่งคืน error response ในรูปแบบ:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### ข้อผิดพลาดที่พบบ่อย

1. **Missing required parameters**: ไม่ได้ส่ง dateFrom หรือ dateTo
2. **Invalid date format**: รูปแบบวันที่ไม่ถูกต้อง
3. **Database connection error**: ไม่สามารถเชื่อมต่อฐานข้อมูลได้
4. **Authentication error**: ไม่มี token หรือ token ไม่ถูกต้อง

## การปรับแต่งเพิ่มเติม

### เพิ่มฟิลด์ใหม่

หากต้องการเพิ่มฟิลด์ใหม่ในตาราง event:

1. อัปเดต SQL schema
2. เพิ่มฟิลด์ใน API response
3. อัปเดต TypeScript interfaces
4. อัปเดต frontend components

### เพิ่มฟิลเตอร์ใหม่

หากต้องการเพิ่มฟิลเตอร์ใหม่:

1. เพิ่ม parameter ใน API endpoint
2. อัปเดต SQL query
3. เพิ่ม parameter ใน TypeScript interfaces
4. อัปเดต frontend filters

## การทดสอบ

### ทดสอบ API ด้วย curl

```bash
# ดึง events
curl -X GET "http://localhost:3001/api/events?dateFrom=2024-01-15&dateTo=2024-01-16" \
  -H "Authorization: Bearer YOUR_TOKEN"

# ดึงช่วงวันที่
curl -X GET "http://localhost:3001/api/events/date-range" \
  -H "Authorization: Bearer YOUR_TOKEN"

# ดึงสถิติ
curl -X GET "http://localhost:3001/api/events/stats?dateFrom=2024-01-15&dateTo=2024-01-16" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### ทดสอบ Frontend

1. เปิดหน้า Event ในแอปพลิเคชัน
2. เลือกช่วงวันที่
3. กดปุ่ม Load
4. ตรวจสอบว่าข้อมูลแสดงผลถูกต้อง
5. ทดสอบการค้นหาและการเรียงลำดับ
6. ทดสอบการแบ่งหน้า
