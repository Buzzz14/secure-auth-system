import { JWTPayload, PasswordStrength } from "@/types";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import zxcvbn from "zxcvbn";

const JWT_SECRET = (process.env.JWT_SECRET || "your-secret-key") as Secret;
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

if (!process.env.JWT_SECRET) {
  console.warn(
    "Warning: JWT_SECRET not set in environment variables. Using default secret."
  );
}

export function generateToken(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const result = zxcvbn(password);

  return {
    score: result.score,
    feedback: result.feedback,
    isStrong: result.score >= 3,
    errors: [],
  };
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  const result = zxcvbn(password);
  const isStrong = result.score >= 3;

  if (!isStrong) {
    errors.push("Password is too weak or common");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateMathCaptcha(): { question: string; answer: number } {
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);

  return {
    question: `What is ${num1} + ${num2}?`,
    answer: num1 + num2,
  };
}
