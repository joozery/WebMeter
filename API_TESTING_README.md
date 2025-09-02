# WebMeter API Testing Guide

คู่มือการทดสอบ API สำหรับ WebMeter Energy Management System

## 📋 Overview

ไฟล์ test scripts เหล่านี้จะช่วยคุณทดสอบ API endpoints ต่างๆ ของ WebMeter server เพื่อให้แน่ใจว่า:

- ✅ Server กำลังทำงานอยู่
- ✅ API endpoints ตอบสนองถูกต้อง
- ✅ Database connections ทำงานได้
- ✅ Authentication system ทำงานได้
- ✅ Data retrieval และ manipulation ทำงานได้

## 🚀 Getting Started

### Prerequisites

1. **Node.js** - ต้องติดตั้ง Node.js (version 14 หรือสูงกว่า)
2. **WebMeter Server** - ต้องรัน server ที่ port 2001
3. **Database** - ต้องมี database connection ที่ทำงานได้

### Installation

1. **Clone หรือ download โปรเจค**
2. **ติดตั้ง dependencies** (ถ้าใช้ axios version):
   ```bash
   npm install axios
   ```

## 📁 Test Scripts

### 1. `test_api_simple.js` (แนะนำ)
- **ไม่ต้องติดตั้ง dependencies เพิ่มเติม**
- ใช้ built-in Node.js modules
- เหมาะสำหรับการทดสอบพื้นฐาน

### 2. `test_api.js` (Advanced)
- **ต้องติดตั้ง axios**: `npm install axios`
- มี features เพิ่มเติม
- Error handling ที่ดีกว่า

## 🧪 Running Tests

### Option 1: Simple Test (แนะนำ)
```bash
node test_api_simple.js
```

### Option 2: Advanced Test
```bash
node test_api.js
```

### Option 3: Test Specific Endpoints
```javascript
const { testHealthCheck, testAuthEndpoints } = require('./test_api_simple');

// Test only health check
testHealthCheck();

// Test only authentication
testAuthEndpoints();
```

## 📊 Test Coverage

### 🔐 Authentication & User Management
- **Login** - `/api/auth/login`
- **Signup** - `/api/signup`
- **Users** - `/api/users`
- **Roles** - `/api/roles`

### 📊 Dashboard & Data
- **Dashboard Summary** - `/api/dashboard/summary`
- **Table Data** - `/api/table-data/meters`
- **Realtime Data** - `/api/realtime-data`

### 🌳 Meter Management
- **Meter Tree** - `/api/meter-tree`
- **Groups** - `/api/groups`

### 📅 System Configuration
- **Holidays** - `/api/holiday`
- **Events** - `/api/events`
- **FT Config** - `/api/ft-config`

### 🏥 Health & Status
- **Health Check** - `/api/health`

## 🎯 Expected Results

### ✅ Success Cases
- **Health Check**: Server responds with status "OK"
- **Authentication**: Endpoints respond (may require valid credentials)
- **Data Endpoints**: Return data or appropriate error messages

### ⚠️ Expected "Failures" (Normal)
- **Login with invalid credentials**: Should return 401/400 (this is correct behavior)
- **Protected endpoints without auth**: Should return 401 (this is correct behavior)
- **Database connection issues**: May return 500 (check database)

## 🔧 Configuration

### Base URL
```javascript
const BASE_URL = 'http://localhost:2001/api';
```

### Timeout
```javascript
req.setTimeout(10000); // 10 seconds
```

### Headers
```javascript
headers: {
  'Content-Type': 'application/json',
  'User-Agent': 'WebMeter-API-Test/1.0'
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Server Not Responding
```
❌ FAIL - Health Check
   Server is not responding
   Error: connect ECONNREFUSED
```
**Solution**: ตรวจสอบว่า server กำลังรันอยู่ที่ port 2001

#### 2. Database Connection Error
```
❌ FAIL - Dashboard Summary
   Dashboard summary endpoint error
   Error: Database connection failed
```
**Solution**: ตรวจสอบ database configuration ใน `server/config.env`

#### 3. CORS Error
```
❌ FAIL - Login Endpoint
   Login endpoint error
   Error: CORS policy violation
```
**Solution**: ตรวจสอบ CORS configuration ใน `server/server.js`

### Debug Mode

เพิ่ม debug logging:
```javascript
// ใน makeRequest function
console.log('Request:', { method, path, data });
console.log('Response:', { statusCode, data });
```

## 📈 Test Results Interpretation

### Test Summary Example
```
📊 Test Summary
Total Tests: 12
Passed: 10
Failed: 2

⚠️  Errors:
  - Dashboard Summary: Authentication required
  - Users List: Database connection failed
```

### What This Means
- **10/12 tests passed**: Most endpoints are working
- **2 failed**: Some issues need attention
- **Authentication required**: Normal for protected endpoints
- **Database connection failed**: Needs investigation

## 🔄 Continuous Testing

### Automated Testing
```bash
# Run tests every 5 minutes
watch -n 300 node test_api_simple.js

# Or use cron job
*/5 * * * * cd /path/to/project && node test_api_simple.js
```

### Integration with CI/CD
```yaml
# .github/workflows/api-test.yml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node test_api_simple.js
```

## 📞 Support

หากพบปัญหาในการใช้งาน:

1. **ตรวจสอบ server logs** ใน `server/` directory
2. **ตรวจสอบ database connection** ใน `server/config.env`
3. **ตรวจสอบ CORS settings** ใน `server/server.js`
4. **ตรวจสอบ firewall settings** สำหรับ port 2001

## 📝 Notes

- Tests จะแสดงผลเป็นสีใน terminal ที่รองรับ ANSI colors
- Timeout ตั้งไว้ที่ 10 วินาทีต่อ request
- Error messages จะแสดงรายละเอียดเพื่อช่วยในการ debug
- Tests บางตัวอาจ "fail" แต่เป็นพฤติกรรมปกติ (เช่น authentication required)

---

**Happy Testing! 🎉**

