// ทดสอบ URL ของ holiday API
const API_BASE_URL = 'http://localhost:3001/api';
const baseUrl = '/holiday';

console.log('🔍 Testing Holiday API URLs:');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('baseUrl:', baseUrl);
console.log('Full URL:', `${API_BASE_URL}${baseUrl}?year=2023`);

// ทดสอบการสร้าง URL
const testUrls = [
  `${API_BASE_URL}${baseUrl}?year=2023`,
  `${API_BASE_URL}${baseUrl}?year=2024`,
  `${API_BASE_URL}${baseUrl}?year=2025`,
  `${API_BASE_URL}${baseUrl}/1`,
  `${API_BASE_URL}${baseUrl}/range/2023/2025`
];

console.log('\n📋 Test URLs:');
testUrls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

console.log('\n✅ URL format should be correct now!');
