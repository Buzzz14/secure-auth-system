import { useState } from "react";
import { Typography, Button, Alert, Space } from "antd";
import { useAuth } from "@/contexts/useAuth";
import { useOTPInput } from "@/hooks/useOTPInput";

const { Title, Text } = Typography;

interface EmailVerificationProps {
  email: string;
  onSuccess?: () => void;
}

export function EmailVerification({
  email,
  onSuccess,
}: EmailVerificationProps) {
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    otp,
    cooldown,
    canResend,
    setOTP,
    handleKeyDown,
    handlePaste,
    startCooldown,
    getOTPString,
  } = useOTPInput();

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);

      await verifyEmail(email, getOTPString());
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setError(null);
      startCooldown();

      await resendVerificationEmail(email);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to resend code. Please try again."
      );
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Title level={2} className="text-center mb-6">
        Verify Your Email
      </Title>

      <Text className="block text-center mb-6">
        Please enter the verification code sent to <strong>{email}</strong>
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
          message="Email verified successfully! Redirecting to login..."
          className="mb-4"
          showIcon
        />
      )}

      <div className="flex justify-center gap-2 mb-6">
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

      <div className="flex flex-col gap-4">
        <Button
          type="primary"
          onClick={handleVerify}
          loading={loading}
          disabled={getOTPString().length !== 6 || success}
          className="w-full"
        >
          Verify Email
        </Button>

        <Button
          type="default"
          onClick={handleResend}
          disabled={!canResend || success}
          className="w-full"
        >
          {cooldown > 0
            ? `Resend code in ${cooldown}s`
            : "Resend verification code"}
        </Button>
      </div>
    </div>
  );
}
