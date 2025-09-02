const fetch = require('node-fetch');

async function testHolidayAPI() {
  try {
    console.log('Testing Holiday API...');
    
    // Test GET /api/holiday?year=2023
    const response = await fetch('http://localhost:3001/api/holiday?year=2023');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testHolidayAPI();
