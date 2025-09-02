# LINE OAuth Setup Guide

## 1. สร้าง LINE Developers Account

### ขั้นตอนที่ 1: สร้าง Account
1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง account และ login
3. สร้าง Provider (ถ้ายังไม่มี)

### ขั้นตอนที่ 2: สร้าง Channel
1. คลิก "Create Channel"
2. เลือก "LINE Login"
3. กรอกข้อมูล:
   - **Channel name**: ชื่อแอปของคุณ (เช่น "WebMeter")
   - **Channel description**: คำอธิบายแอป
   - **Category**: เลือกหมวดหมู่ที่เหมาะสม
   - **Subcategory**: เลือกหมวดหมู่ย่อย

### ขั้นตอนที่ 3: ตั้งค่า Channel
1. **Basic settings**:
   - App icon: อัปโหลดไอคอน
   - App description: คำอธิบายแอป

2. **LINE Login settings**:
   - **Callback URL**: `https://yourdomain.com/api/auth/line/callback`
   - **Scope**: เลือกข้อมูลที่ต้องการ
     - `profile`: ชื่อและรูปโปรไฟล์
     - `openid`: สำหรับ OpenID Connect
     - `email`: อีเมล (ถ้าต้องการ)

3. **Bot settings** (ถ้าต้องการ):
   - เปิดใช้งาน Messaging API
   - ตั้งค่า webhook URL

## 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/`:

```env
# LINE Login Configuration
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CALLBACK_URL=http://localhost:3000/api/auth/line/callback
LINE_REDIRECT_URL=http://localhost:8080

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webmeter_db
DB_USER=webmeter_user
DB_PASSWORD=your_password
```

## 3. อัปเดต Database

รัน SQL script เพื่อเพิ่ม columns ที่จำเป็น:

```sql
-- Add LINE Login columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS line_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS picture TEXT,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local';

-- Create index for line_id
CREATE INDEX IF NOT EXISTS idx_users_line_id ON users(line_id);

-- Update existing users to have provider = 'local'
UPDATE users SET provider = 'local' WHERE provider IS NULL;
```

## 4. ตั้งค่า Backend

### ติดตั้ง Dependencies
```bash
npm install axios jsonwebtoken
```

### ตั้งค่า Routes
ไฟล์ `server/routes/auth.js` จะมี endpoints สำหรับ:
- `GET /api/auth/line/login` - สร้าง LINE login URL
- `GET /api/auth/line/callback` - รับ callback จาก LINE

## 5. ตั้งค่า Frontend

### Components ที่สร้าง:
- `LineLoginButton` - ปุ่มสำหรับ LINE login
- `AuthCallback` - หน้า callback สำหรับรับ token
- `Login` - หน้า login ที่มี LINE login button

### Routes ที่เพิ่ม:
- `/auth/callback` - สำหรับรับ token หลังจาก LINE login

## 6. การทดสอบ

### Development
1. ตั้งค่า Callback URL เป็น: `http://localhost:3000/api/auth/line/callback`
2. ตั้งค่า Redirect URL เป็น: `http://localhost:8080`

### Production
1. ตั้งค่า Callback URL เป็น: `https://yourdomain.com/api/auth/line/callback`
2. ตั้งค่า Redirect URL เป็น: `https://yourdomain.com`

## 7. Flow การทำงาน

1. **User คลิก LINE Login Button**
2. **Frontend เรียก API** `/api/auth/line/login`
3. **Backend สร้าง LINE OAuth URL** และส่งกลับ
4. **Frontend redirect ไปยัง LINE**
5. **User login ใน LINE** และ authorize แอป
6. **LINE redirect กลับมา** ที่ callback URL พร้อม code
7. **Backend รับ code** และ exchange เป็น access token
8. **Backend เรียก LINE API** เพื่อดึงข้อมูล user profile
9. **Backend สร้าง/อัปเดต user** ใน database
10. **Backend สร้าง JWT token** และ redirect ไปยัง frontend
11. **Frontend รับ token** และเก็บใน localStorage
12. **Frontend redirect** ไปยัง dashboard

## 8. Security Considerations

1. **State Parameter**: ใช้ state parameter เพื่อป้องกัน CSRF attack
2. **Nonce**: ใช้ nonce เพื่อป้องกัน replay attack
3. **HTTPS**: ใช้ HTTPS ใน production
4. **Token Storage**: เก็บ token ใน localStorage หรือ httpOnly cookie
5. **Token Expiration**: ตั้งค่า token expiration ที่เหมาะสม

## 9. Troubleshooting

### ปัญหาที่พบบ่อย:

1. **Invalid redirect URI**
   - ตรวจสอบ Callback URL ใน LINE Developers Console
   - ตรวจสอบ environment variables

2. **Invalid client_id**
   - ตรวจสอบ LINE_CHANNEL_ID ใน environment variables

3. **Invalid client_secret**
   - ตรวจสอบ LINE_CHANNEL_SECRET ใน environment variables

4. **Database errors**
   - ตรวจสอบ database connection
   - ตรวจสอบ SQL script execution

5. **CORS errors**
   - ตั้งค่า CORS ใน backend
   - ตรวจสอบ domain settings

## 10. Production Deployment

1. **SSL Certificate**: ต้องมี SSL certificate
2. **Domain**: ต้องมี domain name ที่ถูกต้อง
3. **Environment Variables**: ตั้งค่า environment variables ใน production
4. **Database**: ตั้งค่า production database
5. **Monitoring**: ตั้งค่า monitoring และ logging

