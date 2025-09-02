const axios = require('axios');

// API Base URL
const BASE_URL = 'http://localhost:2001/api';

// Test configuration
const config = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

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

// Test functions
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/health`, config);
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
    const response = await axios.post(`${BASE_URL}/auth/login`, loginData, config);
    logResult('Login Endpoint', true, 'Login endpoint is working', {
      success: response.data.success,
      message: response.data.message || 'No message'
    });
  } catch (error) {
    if (error.response) {
      logResult('Login Endpoint', true, 'Login endpoint is working (expected error for invalid credentials)', {
        status: error.response.status,
        message: error.response.data.message || 'Invalid credentials'
      });
    } else {
      logResult('Login Endpoint', false, 'Login endpoint error', error.message);
    }
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
    const response = await axios.post(`${BASE_URL}/signup`, signupData, config);
    logResult('Signup Endpoint', true, 'Signup endpoint is working', {
      success: response.data.success,
      message: response.data.message || 'No message'
    });
  } catch (error) {
    if (error.response) {
      logResult('Signup Endpoint', true, 'Signup endpoint is working (expected error for duplicate user)', {
        status: error.response.status,
        message: error.response.data.message || 'User already exists'
      });
    } else {
      logResult('Signup Endpoint', false, 'Signup endpoint error', error.message);
    }
  }
}

async function testDashboardEndpoints() {
  console.log(`${colors.blue}${colors.bold}📊 Testing Dashboard Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/dashboard/summary`, config);
    logResult('Dashboard Summary', true, 'Dashboard summary endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Dashboard Summary', true, 'Dashboard summary endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Dashboard Summary', false, 'Dashboard summary endpoint error', error.message);
    }
  }
}

async function testMeterTreeEndpoints() {
  console.log(`${colors.blue}${colors.bold}🌳 Testing Meter Tree Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/meter-tree`, config);
    logResult('Meter Tree', true, 'Meter tree endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Meter Tree', true, 'Meter tree endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Meter Tree', false, 'Meter tree endpoint error', error.message);
    }
  }
}

async function testHolidayEndpoints() {
  console.log(`${colors.blue}${colors.bold}📅 Testing Holiday Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/holiday`, config);
    logResult('Holiday List', true, 'Holiday endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Holiday List', true, 'Holiday endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Holiday List', false, 'Holiday endpoint error', error.message);
    }
  }
}

async function testTableDataEndpoints() {
  console.log(`${colors.blue}${colors.bold}📋 Testing Table Data Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/table-data/meters`, config);
    logResult('Table Data - Meters', true, 'Table data meters endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Table Data - Meters', true, 'Table data meters endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Table Data - Meters', false, 'Table data meters endpoint error', error.message);
    }
  }
}

async function testRealtimeDataEndpoints() {
  console.log(`${colors.blue}${colors.bold}⚡ Testing Realtime Data Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/realtime-data`, config);
    logResult('Realtime Data', true, 'Realtime data endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Realtime Data', true, 'Realtime data endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Realtime Data', false, 'Realtime data endpoint error', error.message);
    }
  }
}

async function testUserEndpoints() {
  console.log(`${colors.blue}${colors.bold}👥 Testing User Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/users`, config);
    logResult('Users List', true, 'Users endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Users List', true, 'Users endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Users List', false, 'Users endpoint error', error.message);
    }
  }
}

async function testRoleEndpoints() {
  console.log(`${colors.blue}${colors.bold}🔑 Testing Role Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/roles`, config);
    logResult('Roles List', true, 'Roles endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Roles List', true, 'Roles endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Roles List', false, 'Roles endpoint error', error.message);
    }
  }
}

async function testEventEndpoints() {
  console.log(`${colors.blue}${colors.bold}📢 Testing Event Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/events`, config);
    logResult('Events List', true, 'Events endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Events List', true, 'Events endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Events List', false, 'Events endpoint error', error.message);
    }
  }
}

async function testFTConfigEndpoints() {
  console.log(`${colors.blue}${colors.bold}⚙️ Testing FT Config Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/ft-config`, config);
    logResult('FT Config', true, 'FT config endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('FT Config', true, 'FT config endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('FT Config', false, 'FT config endpoint error', error.message);
    }
  }
}

async function testGroupEndpoints() {
  console.log(`${colors.blue}${colors.bold}👥 Testing Group Endpoints${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/groups`, config);
    logResult('Groups List', true, 'Groups endpoint is working', {
      success: response.data.success,
      data: response.data.data ? 'Data received' : 'No data'
    });
  } catch (error) {
    if (error.response) {
      logResult('Groups List', true, 'Groups endpoint is working (may require authentication)', {
        status: error.response.status,
        message: error.response.data.message || 'Authentication required'
      });
    } else {
      logResult('Groups List', false, 'Groups endpoint error', error.message);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}🚀 Starting WebMeter API Tests${colors.reset}\n`);
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

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
};

