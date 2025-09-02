// Simple API Test Script (ES Modules)
// This script uses built-in Node.js modules to test API endpoints

import http from 'http';
import https from 'https';

// API Base URL
const BASE_URL = 'http://localhost:2001/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to log results
function logResult(testName, success, message = '', data = null) {
  testResults.total++;
  
  if (success) {
    testResults.passed++;
    console.log(`${colors.green}✅ PASS${colors.reset} - ${testName}`);
    if (message) console.log(`   ${message}`);
    if (data) console.log(`   Data:`, data);
  } else {
    testResults.failed++;
    testResults.errors.push({ testName, message, data });
    console.log(`${colors.red}❌ FAIL${colors.reset} - ${testName}`);
    if (message) console.log(`   ${message}`);
    if (data) console.log(`   Error:`, data);
  }
  console.log('');
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WebMeter-API-Test/1.0'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(10000); // 10 seconds timeout

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  try {
    const response = await makeRequest('GET', '/health');
    logResult('Health Check', true, 'Server is running', {
      status: response.data.status,
      timestamp: response.data.timestamp
    });
  } catch (error) {
    logResult('Health Check', false, 'Server is not responding', error.message);
  }
}

async function testAuthEndpoints() {
  console.log(`${colors.blue}${colors.bold}🔐 Testing Authentication Endpoints${colors.reset}\n`);
  
  // Test login endpoint
  try {
    const loginData = {
      username: 'testuser',
      password: 'testpass'
    };
    const response = await makeRequest('POST', '/auth/login', loginData);
    logResult('Login Endpoint', true, 'Login endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      message: response.data.message || 'No message'
    });
  } catch (error) {
    logResult('Login Endpoint', false, 'Login endpoint error', error.message);
  }

  // Test signup endpoint
  try {
    const signupData = {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'testpass123',
      name: 'Test',
      surname: 'User'
    };
    const response = await makeRequest('POST', '/signup', signupData);
    logResult('Signup Endpoint', true, 'Signup endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      message: response.data.message || 'No message'
    });
  } catch (error) {
    logResult('Signup Endpoint', false, 'Signup endpoint error', error.message);
  }
}

async function testDashboardEndpoints() {
  console.log(`${colors.blue}${colors.bold}📊 Testing Dashboard Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/dashboard/summary');
    logResult('Dashboard Summary', true, 'Dashboard summary endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Dashboard Summary', false, 'Dashboard summary endpoint error', error.message);
  }
}

async function testMeterTreeEndpoints() {
  console.log(`${colors.blue}${colors.bold}🌳 Testing Meter Tree Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/meter-tree');
    logResult('Meter Tree', true, 'Meter tree endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Meter Tree', false, 'Meter tree endpoint error', error.message);
  }
}

async function testHolidayEndpoints() {
  console.log(`${colors.blue}${colors.bold}📅 Testing Holiday Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/holiday');
    logResult('Holiday List', true, 'Holiday endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Holiday List', false, 'Holiday endpoint error', error.message);
  }
}

async function testTableDataEndpoints() {
  console.log(`${colors.blue}${colors.bold}📋 Testing Table Data Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/table-data/meters');
    logResult('Table Data - Meters', true, 'Table data meters endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Table Data - Meters', false, 'Table data meters endpoint error', error.message);
  }
}

async function testRealtimeDataEndpoints() {
  console.log(`${colors.blue}${colors.bold}⚡ Testing Realtime Data Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/realtime-data');
    logResult('Realtime Data', true, 'Realtime data endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Realtime Data', false, 'Realtime data endpoint error', error.message);
  }
}

async function testUserEndpoints() {
  console.log(`${colors.blue}${colors.bold}👥 Testing User Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/users');
    logResult('Users List', true, 'Users endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Users List', false, 'Users endpoint error', error.message);
  }
}

async function testRoleEndpoints() {
  console.log(`${colors.blue}${colors.bold}🔑 Testing Role Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/roles');
    logResult('Roles List', true, 'Roles endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Roles List', false, 'Roles endpoint error', error.message);
  }
}

async function testEventEndpoints() {
  console.log(`${colors.blue}${colors.bold}📢 Testing Event Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/events');
    logResult('Events List', true, 'Events endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Events List', false, 'Events endpoint error', error.message);
  }
}

async function testFTConfigEndpoints() {
  console.log(`${colors.blue}${colors.bold}⚙️ Testing FT Config Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/ft-config');
    logResult('FT Config', true, 'FT config endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('FT Config', false, 'FT config endpoint error', error.message);
  }
}

async function testGroupEndpoints() {
  console.log(`${colors.blue}${colors.bold}👥 Testing Group Endpoints${colors.reset}\n`);
  
  try {
    const response = await makeRequest('GET', '/groups');
    logResult('Groups List', true, 'Groups endpoint is working', {
      statusCode: response.statusCode,
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    logResult('Groups List', false, 'Groups endpoint error', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}🚀 Starting WebMeter API Tests (Simple Version)${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  try {
    // Run all tests
    await testHealthCheck();
    await testAuthEndpoints();
    await testDashboardEndpoints();
    await testMeterTreeEndpoints();
    await testHolidayEndpoints();
    await testTableDataEndpoints();
    await testRealtimeDataEndpoints();
    await testUserEndpoints();
    await testRoleEndpoints();
    await testEventEndpoints();
    await testFTConfigEndpoints();
    await testGroupEndpoints();
    
    // Print summary
    console.log(`${colors.bold}${colors.blue}📊 Test Summary${colors.reset}`);
    console.log(`${colors.bold}Total Tests:${colors.reset} ${testResults.total}`);
    console.log(`${colors.green}${colors.bold}Passed:${colors.reset} ${testResults.passed}`);
    console.log(`${colors.red}${colors.bold}Failed:${colors.reset} ${testResults.failed}`);
    
    if (testResults.errors.length > 0) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  Errors:${colors.reset}`);
      testResults.errors.forEach(error => {
        console.log(`  - ${error.testName}: ${error.message}`);
      });
    }
    
    if (testResults.failed === 0) {
      console.log(`\n${colors.green}${colors.bold}🎉 All tests passed!${colors.reset}`);
    } else {
      console.log(`\n${colors.red}${colors.bold}❌ Some tests failed. Please check the errors above.${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}${colors.bold}💥 Test runner error:${colors.reset}`, error.message);
  }
}

// Run tests
runAllTests();
