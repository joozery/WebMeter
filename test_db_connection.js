const db = require('./server/config/database');

async function testDatabaseConnection() {
  try {
    console.log('🧪 Testing database connection...');
    
    // ทดสอบการเชื่อมต่อ
    const result = await db.pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log('📅 Current time from DB:', result.rows[0].current_time);
    
    // ทดสอบการเข้าถึงตาราง holiday
    const holidayResult = await db.pool.query('SELECT COUNT(*) as count FROM holiday');
    console.log('📊 Holiday table count:', holidayResult.rows[0].count);
    
    // ทดสอบข้อมูล holiday ปี 2023
    const holiday2023 = await db.pool.query('SELECT * FROM holiday WHERE EXTRACT(YEAR FROM date) = 2023 LIMIT 5');
    console.log('📅 Holidays 2023:', holiday2023.rows.length, 'records');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('❌ Error stack:', error.stack);
  } finally {
    await db.pool.end();
  }
}

testDatabaseConnection();
