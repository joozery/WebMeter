import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        if (error || errorMessage) {
          setStatus('error');
          setMessage(errorMessage || 'Authentication failed');
          return;
        }

        if (token) {
          // Store token in localStorage
          localStorage.setItem('token', token);
          
          // Verify token with backend
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setStatus('success');
            setMessage('เข้าสู่ระบบสำเร็จ!');
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            throw new Error('Token verification failed');
          }
        } else {
          throw new Error('No token received');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">การยืนยันตัวตน</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-500" />
              <p className="text-gray-600">กำลังยืนยันตัวตน...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <p className="text-green-600 font-medium">{message}</p>
              <p className="text-sm text-gray-500">กำลังเปลี่ยนเส้นทางไปยังหน้าแดชบอร์ด...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-500" />
              <p className="text-red-600 font-medium">{message}</p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  ลองใหม่
                </Button>
                <Button onClick={handleGoHome} variant="outline" className="w-full">
                  กลับหน้าหลัก
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


