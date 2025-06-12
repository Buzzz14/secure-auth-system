'use client';

import { useRouter } from 'next/navigation';
import { Button, Typography } from 'antd';
import { useAuth } from '@/contexts/useAuth';

const { Title, Text } = Typography;

export default function HomePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  
  const handleLogin = () => {
    router.push('/auth/login');
  };
  
  const handleRegister = () => {
    router.push('/auth/register');
  };
  
  const handleLogout = () => {
    logout();
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Title level={3}>Loading...</Title>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        {user ? (
          <>
            <Title level={2} className="text-center">
              Welcome, {user.firstName}!
            </Title>
            <div className="space-y-4">
              <div className="text-center">
                <Text>You are logged in as {user.email}</Text>
              </div>
              <div className="flex justify-center space-x-4">
                <Button
                  type="primary"
                  danger
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Title level={2} className="text-center">
              Welcome to Our App!
            </Title>
            <div className="space-y-4">
              <div className="text-center">
                <Text>Please login or register to get started</Text>
        </div>
              <div className="flex justify-center space-x-4">
                <Button
                  type="primary"
                  onClick={handleLogin}
                >
                  Login
                </Button>
                <Button
                  onClick={handleRegister}
                >
                  Register
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
