import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LineCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processLineLogin = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (!code) {
        setError('ไม่พบ Authorization Code จาก LINE');
        return;
      }

      try {
        const response = await axios.post('/api/auth/line-login', { code });

        if (response.data.success && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userUsername', response.data.user.name || 'line_user');
          localStorage.setItem('isGuest', 'false');
          navigate('/dashboard'); // Redirect to dashboard
        } else {
          setError(response.data.error || 'การเข้าสู่ระบบด้วย LINE ล้มเหลว');
        }
      } catch (err: any) {
        console.error('Line callback error:', err);
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'เกิดข้อผิดพลาดในการสื่อสารกับเซิร์ฟเวอร์';
        setError(errorMessage);
      }
    };

    processLineLogin();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow-lg rounded-lg text-center">
        {error ? (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-700">{error}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              กลับไปหน้า Login
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800">กำลังดำเนินการ...</h2>
            <p className="text-gray-600">กรุณารอสักครู่ ระบบกำลังทำการยืนยันตัวตนผ่าน LINE</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LineCallback;



