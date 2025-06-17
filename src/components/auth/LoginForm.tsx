"use client";
import { useState } from "react";
import { Form, Input, Button, Alert, Typography, message } from "antd";
import { useAuth } from "@/contexts/useAuth";
import { useCaptcha } from "@/hooks/useCaptcha";
import { LoginFormData } from "@/types";

const { Title, Text } = Typography;

export function LoginForm() {
  const [form] = Form.useForm<LoginFormData>();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    question,
    answer: expectedAnswer,
    isReady,
    regenerateCaptcha,
    setUserAnswer,
  } = useCaptcha();

  const onFinish = async (values: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate captcha
      if (parseInt(values.captchaAnswer, 10) !== expectedAnswer) {
        setError("Invalid captcha answer");
        return;
      }

      await login(
        values.identifier,
        values.password,
        values.captchaAnswer,
        expectedAnswer
      );
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Title level={2} className="text-center mb-6">
        Login
      </Title>

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
          name="identifier"
          label="Email or Username"
          rules={[
            { required: true, message: "Please enter your email or username" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password />
        </Form.Item>

        <div className="mb-4">
          {isReady ? (
            <>
              <Text strong>{question}</Text>
              <Form.Item
                name="captchaAnswer"
                rules={[
                  { required: true, message: "Please answer the CAPTCHA" },
                  {
                    validator: async (_, value) => {
                      if (!value) return;
                      const numValue = parseInt(value, 10);
                      if (isNaN(numValue) || numValue !== expectedAnswer) {
                        throw new Error("Incorrect answer");
                      }
                    },
                  },
                ]}
              >
                <Input
                  placeholder="Enter your answer"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^-?\d+$/.test(value)) {
                      setUserAnswer(value);
                    }
                  }}
                />
              </Form.Item>
              <Button
                type="link"
                onClick={() => {
                  regenerateCaptcha();
                  form.resetFields(["captchaAnswer"]);
                  setUserAnswer("");
                }}
              >
                Get new question
              </Button>
            </>
          ) : (
            <div className="text-center">
              <Text>Loading CAPTCHA...</Text>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <Text className="text-sm">
            <a href="/auth/forgot-password">Forgot password?</a>
          </Text>
          <Text className="text-sm">
            <a href="/auth/register">Create account</a>
          </Text>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full"
          >
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
