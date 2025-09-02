# WebMeter - การเชื่อมต่อ Database กับ Frontend

## ✅ สิ่งที่เราได้ทำเสร็จแล้ว

### 1. 🗄️ Database Layer
- ✅ PostgreSQL Database (`Webmeter_db`)
- ✅ Users table with complete schema
- ✅ Roles and Permissions system  
- ✅ Sample data (17 users including Support06)
- ✅ Database connection scripts

### 2. 🔌 Backend API Server
- ✅ Express.js server with TypeScript support
- ✅ PostgreSQL connection with pool
- ✅ REST API endpoints for user management
- ✅ Authentication with JWT
- ✅ Input validation with Joi
- ✅ Security features (CORS, Rate limiting, Helmet)
- ✅ Error handling และ logging

### 3. 🎨 Frontend API Integration
- ✅ API client service (`src/services/api.ts`)
- ✅ TypeScript interfaces for data types
- ✅ Environment configuration
- ✅ Error handling utilities

## 🚀 วิธีการเริ่มต้นใช้งาน

### ขั้นตอนที่ 1: เตรียม Database
```bash
# สร้าง database และตาราง
sudo -u postgres psql -f database/simple_user_database.sql
sudo -u postgres psql -f database/simple_user_data.sql
```

### ขั้นตอนที่ 2: ติดตั้ง Dependencies
```bash
# ติดตั้งทั้งหมดพร้อมกัน
npm run install:all

# หรือติดตั้งแยก
npm install
cd server && npm install
```

### ขั้นตอนที่ 3: เริ่มต้น Development Environment
```bash
# วิธีที่ 1: ใช้ PowerShell script (แนะนำ)
npm run dev:full

# วิธีที่ 2: เริ่มแยกใน terminal ต่างหาก
# Terminal 1: API Server
npm run dev:server

# Terminal 2: Frontend
npm run dev
```

## 📋 API Endpoints ที่พร้อมใช้งาน

### User Management
- `GET /api/users` - ดึงรายชื่อผู้ใช้ (พร้อม search, filter, pagination)
- `POST /api/users` - สร้างผู้ใช้ใหม่
- `PUT /api/users/:id` - แก้ไขข้อมูลผู้ใช้
- `DELETE /api/users/:id` - ลบผู้ใช้
- `PATCH /api/users/:id/status` - เปลี่ยนสถานะ active/inactive

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/verify` - ตรวจสอบ session

## 🔧 การปรับปรุง Users.tsx ให้เชื่อมต่อ Database

ตอนนี้คุณสามารถแก้ไข `src/pages/Users.tsx` เพื่อใช้ API แทน static data:

```typescript
// เปลี่ยนจาก static userData เป็น
import { apiClient, User } from '../services/api';

// ใน component
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);

// ดึงข้อมูลจาก API
useEffect(() => {
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers({
        search: searchTerm,
        level: selectedLevel,
        status: selectedStatus,
        sortBy: sortField,
        sortOrder: sortDirection,
        page: 1,
        limit: 100
      });
      
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
}, [searchTerm, selectedLevel, selectedStatus, sortField, sortDirection]);

// เมื่อเพิ่มผู้ใช้ใหม่
const handleAddUser = async (userData) => {
  try {
    const response = await apiClient.createUser(userData);
    if (response.success) {
      // รีเฟรชรายการผู้ใช้
      fetchUsers();
      setIsAddDialogOpen(false);
    }
  } catch (error) {
    console.error('Failed to create user:', error);
  }
};
```

## 🎯 ข้อดีของระบบนี้

### 🚀 Performance
- Connection pooling สำหรับ PostgreSQL
- Rate limiting (100 requests/15 min)
- Optimized queries with proper indexing
- Pagination support

### 🔒 Security
- JWT authentication
- bcrypt password hashing (12 rounds)
- SQL injection protection
- CORS และ security headers
- Input validation และ sanitization

### 📈 Scalability
- RESTful API design
- Modular code structure
- Environment-based configuration
- Error handling และ logging

### 🛠️ Developer Experience
- TypeScript support ทั้ง frontend และ backend
- Auto-reload ใน development
- Comprehensive error messages
- API documentation

## 📝 ตัวอย่างการใช้งาน API

### ดึงรายชื่อผู้ใช้
```typescript
const users = await apiClient.getUsers({
  search: 'admin',
  level: 'Admin',
  status: 'active',
  page: 1,
  limit: 10
});
```

### สร้างผู้ใช้ใหม่
```typescript
const newUser = await apiClient.createUser({
  username: 'newuser',
  email: 'newuser@webmeter.com',
  password: 'Password123!',
  name: 'New',
  surname: 'User',
  address: 'Some Address',
  level: 'Operator',
  status: 'active',
  note: 'New operator user'
});
```

### อัปเดตสถานะผู้ใช้
```typescript
await apiClient.updateUserStatus(userId, 'inactive');
```

## 🔄 ขั้นตอนต่อไป

1. **ปรับปรุง Users.tsx** ให้ใช้ API แทน static data
2. **เพิ่ม Loading states** และ error handling ใน UI
3. **ทำ Authentication system** สำหรับ login/logout
4. **เพิ่ม Toast notifications** สำหรับ user feedback
5. **ทำ Real-time updates** ด้วย WebSocket (ถ้าต้องการ)

ระบบนี้พร้อมใช้งานแล้ว และมีประสิทธิภาพสูงในการจัดการข้อมูลผู้ใช้จำนวนมาก! 🎉
