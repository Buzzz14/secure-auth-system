"use client";

import { useEffect, useState } from "react";
import { Form, Input, Button, Progress, Alert, Space, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/useAuth";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { useCaptcha } from "@/hooks/useCaptcha";
import { RegisterFormData } from "@/types";

const { Title, Text } = Typography;

export default function RegisterForm() {
  const router = useRouter();
  const [form] = Form.useForm<RegisterFormData>();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const password = Form.useWatch("password", form);
  const { strength, getStrengthColor, getStrengthText } = usePasswordStrength(
    password || ""
  );

  const {
    question,
    answer: expectedAnswer,
    isReady,
    regenerateCaptcha,
    setUserAnswer,
  } = useCaptcha();

  const onFinish = async (values: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);

      await register({
        ...values,
        captchaAnswer: values.captchaAnswer,
        expectedAnswer: expectedAnswer,
      });

      setSuccess(true);
      form.resetFields();
      regenerateCaptcha();

      // Redirect to email verification page
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(values.email)}`
      );
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) {
      form.validateFields(["password"]);
    }
  }, [strength.score]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Title level={2} className="text-center mb-6">
        Create Account
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

      {success && (
        <Alert
          type="success"
          message="Registration successful! Please check your email for verification."
          className="mb-4"
          showIcon
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Space direction="horizontal" className="w-full gap-4">
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: "Please enter your first name" },
            ]}
            className="flex-1"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Please enter your last name" }]}
            className="flex-1"
          >
            <Input />
          </Form.Item>
        </Space>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="username"
          label="Username"
          rules={[
            { required: true, message: "Please enter a username" },
            { min: 3, message: "Username must be at least 3 characters" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: "Please enter a password" },
            {
              validator: async (_, value) => {
                if (value && !strength.isStrong) {
                  throw new Error("Password does not meet requirements");
                }
              },
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        {password && (
          <div className="mb-4">
            <Progress
              percent={strength.score * 25}
              status={strength.isStrong ? "success" : "active"}
              strokeColor={getStrengthColor()}
            />
            <Text type={strength.isStrong ? "success" : "warning"}>
              {getStrengthText()}
            </Text>
            {strength.errors.length > 0 && (
              <ul className="mt-2 text-red-500 text-sm">
                {strength.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
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

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full"
          >
            Register
          </Button>
        </Form.Item>
      </Form>
      <div className="text-center">
        <Text className="text-sm">
          Already have an account? <a href="/auth/login">Login</a>
        </Text>
      </div>
    </div>
  );
}
