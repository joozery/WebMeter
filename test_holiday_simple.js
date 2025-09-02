// ทดสอบ API holiday แบบง่าย
const http = require('http');

function testHolidayAPI() {
  console.log('🧪 Testing Holiday API...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/holiday?year=2023',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    console.log(`📡 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('📊 Response:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('📄 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.end();
}

testHolidayAPI();
