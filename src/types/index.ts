export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  captchaAnswer: string;
  expectedAnswer: number;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginFormData {
  identifier: string;
  password: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  captchaAnswer: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export interface PasswordStrength {
  score: number;
  feedback: {
    warning: string;
    suggestions: string[];
  };
  isStrong: boolean;
  errors: string[];
}

export interface UseCaptcha {
  question: string;
  answer: number;
  userAnswer: string;
  setUserAnswer: (value: string) => void;
  regenerateCaptcha: () => void;
  isReady: boolean;
}

export interface UseOTPInput {
  otp: string[];
  cooldown: number;
  canResend: boolean;
  setOTP: (index: number, value: string) => void;
  handleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => void;
  startCooldown: () => void;
  getOTPString: () => string;
}