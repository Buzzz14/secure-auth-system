import { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/useAuth';
import { ForgotPasswordFormData } from '@/types';

const { Title, Text } = Typography;

export function ForgotPassword() {
  const router = useRouter();
  const [form] = Form.useForm<ForgotPasswordFormData>();
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const onFinish = async (values: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      await forgotPassword(values.email);
      
      // Redirect to reset password page
      router.push(`/auth/reset-password?email=${encodeURIComponent(values.email)}`);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Title level={2} className="text-center mb-6">
        Forgot Password
      </Title>
      
      <Text className="block text-center mb-6">
        Enter your email address and we'll send you instructions to reset your password.
      </Text>
      
      {error && (
        <Alert
          type="error"
          message={error}
          className="mb-4"
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input />
        </Form.Item>
        
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full"
          >
            Send Reset Instructions
          </Button>
        </Form.Item>
        
        <div className="text-center">
          <Text className="text-sm">
            Remember your password? <a href="/auth/login">Login</a>
          </Text>
        </div>
      </Form>
    </div>
  );
} 