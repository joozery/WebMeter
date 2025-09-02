const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

// Import routes
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const tableDataRoutes = require('./routes/table-data');
const realtimeDataRoutes = require('./routes/realtime-data');
const dashboardRoutes = require('./routes/dashboard');
const signupRoutes = require('./routes/signup');
const eventRoutes = require('./routes/events');
const meterTreeRoutes = require('./routes/meter-tree');
const holidayRoutes = require('./routes/holiday');
const ftConfigRoutes = require('./routes/ft-config');

const app = express();
const PORT = process.env.PORT || 2001;

// Security middleware
app.use(helmet());

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Referer', 'User-Agent']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
const emailRoutes = require('./routes/email');
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/table-data', tableDataRoutes);
app.use('/', realtimeDataRoutes); // ใช้ root path เพราะ route เริ่มต้นด้วย /api
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/signup', signupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/meter-tree', meterTreeRoutes);
app.use('/api/holiday', holidayRoutes);
app.use('/api/ft-config', ftConfigRoutes);

// Test event endpoint without authentication
app.get('/api/test-events', (req, res) => {
  res.json({
    success: true,
    message: 'Event API is working!',
    timestamp: new Date().toISOString()
  });
});

// Test database schema endpoint
app.get('/api/test-db-schema', async (req, res) => {
  try {
    const db = require('./config/database');
    
    // Get users table structure
    const [usersSchema] = await db.query(`
      DESCRIBE users
    `);
    
    // Get sample data from users table
    const [usersData] = await db.query(`
      SELECT * FROM users LIMIT 1
    `);
    
    // Check if locations table exists
    const [tablesQuery] = await db.query('SHOW TABLES');
    const tableNames = tablesQuery.map(row => Object.values(row)[0]);
    
    res.json({
      success: true,
      message: 'Database schema retrieved successfully',
      usersTable: {
        structure: usersSchema,
        sampleData: usersData[0] || null
      },
      allTables: tableNames,
      hasLocationsTable: tableNames.includes('locations'),
      locationsTable: tableNames.includes('locations') ? {
        structure: await db.query('DESCRIBE locations').then(result => result[0])
      } : null
    });
  } catch (error) {
    console.error('Error getting database schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database schema',
      message: error.message
    });
  }
});
const groupRoutes = require('./routes/groups');
app.use('/api/groups', groupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'WebMeter API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON format',
      message: 'Please check your request body format'
    });
  }
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WebMeter API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
