import { useEffect, useState } from "react";
import { Form, Input, Button, Alert, Typography, Progress } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/useAuth";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { useOTPInput } from "@/hooks/useOTPInput";
import { ResetPasswordFormData } from "@/types";

const { Title, Text } = Typography;

interface ResetPasswordProps {
  email: string;
}

export function ResetPassword({ email }: ResetPasswordProps) {
  const router = useRouter();
  const [form] = Form.useForm<ResetPasswordFormData>();
  const { resetPassword, resendResetCode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    otp,
    cooldown,
    canResend,
    setOTP,
    handlePaste,
    handleKeyDown,
    startCooldown,
    getOTPString,
  } = useOTPInput();

  const password = Form.useWatch("newPassword", form);
  const { strength, getStrengthColor, getStrengthText } = usePasswordStrength(
    password || ""
  );

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      setError(null);
      await resendResetCode(email);
      setResendSuccess(true);
      startCooldown();
      // Clear success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Failed to resend verification code. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };

  const onFinish = async (values: ResetPasswordFormData) => {
    try {
      setLoading(true);
      setError(null);

      await resetPassword({
        email,
        otp: getOTPString(),
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      setSuccess(true);
      form.resetFields();

      // Redirect to login page after successful reset
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Password reset failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) {
      form.validateFields(["newPassword"]);
    }
  }, [strength.score]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Title level={2} className="text-center mb-6">
        Reset Password
      </Title>

      <Text className="block text-center mb-6">
        Enter the verification code sent to <strong>{email}</strong> and your
        new password.
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

      {success && (
        <Alert
          type="success"
          message="Password has been reset successfully! Redirecting to login..."
          className="mb-4"
          showIcon
        />
      )}

      {resendSuccess && (
        <Alert
          type="success"
          message="Verification code has been resent to your email"
          className="mb-4"
          showIcon
        />
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Text strong>Verification Code</Text>
        </div>
        <div className="flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[index] || ""}
              onChange={(e) => setOTP(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-2xl border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          ))}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: "Please enter a new password" },
            {
              validator: async (_, value) => {
                if (!value) return Promise.resolve();

                if (strength.errors.length > 0) {
                  throw new Error(strength.errors[0]);
                }

                if (value && strength.score < 3) {
                  throw new Error("Password is not strong enough");
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
          label="Confirm New Password"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm your new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <div className="flex flex-col gap-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={getOTPString().length !== 6 || success}
              className="w-full"
            >
              Reset Password
            </Button>
            <Button
              type="default"
              onClick={handleResendCode}
              loading={resendLoading}
              disabled={!canResend}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
}
