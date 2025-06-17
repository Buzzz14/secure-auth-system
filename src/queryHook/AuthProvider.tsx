"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AuthContext } from "@/contexts/useAuth";
import { RegisterData, ResetPasswordData, User } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState({
    user: null as User | null,
    token: null as string | null,
    isLoading: true,
    error: null as string | null,
  });

  const queryClient = useQueryClient();

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        const user = JSON.parse(userStr);

        // Validate user object has required fields
        if (user && user.id && user.email) {
          setAuthState({
            token,
            user,
            isLoading: false,
            error: null,
          });

          // Ensure axios is configured with the token
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          return;
        }
      }

      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error("Error initializing auth state:", error);
      // Clear potentially corrupted data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // Set up axios interceptor for auth token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (authState.token) {
          config.headers.Authorization = `Bearer ${authState.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [authState.token]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: {
      identifier: string;
      password: string;
      captchaAnswer: string;
      expectedAnswer: number;
    }) => {
      const { data } = await axios.post("/api/auth/login", credentials);
      return data;
    },
    onSuccess: (data) => {
      // Check if email verification is required
      if (data.requiresVerification) {
        // Redirect to verify page with email
        window.location.href = `/auth/verify?email=${encodeURIComponent(
          data.email
        )}`;
        return;
      }

      // Update axios first
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      // Then update storage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      document.cookie = `token=${data.token}; path=/; max-age=${
        7 * 24 * 60 * 60
      }; SameSite=Strict`;

      // Finally update state
      setAuthState((prevState) => {
        return {
          user: data.user,
          token: data.token,
          isLoading: false,
          error: null,
        };
      });

      // Redirect to home page
      window.location.href = "/";
    },
    onError: (error: any) => {
      console.error("Login mutation error:", error);

      // Check if it's an unverified email error
      if (
        error.response?.status === 403 &&
        error.response?.data?.requiresVerification
      ) {
        window.location.href = `/auth/verify-email?email=${encodeURIComponent(
          error.response.data.email
        )}`;
        return;
      }

      // Clear any existing auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      delete axios.defaults.headers.common["Authorization"];

      setAuthState({
        user: null,
        token: null,
        error: error.response?.data?.error || "Login failed",
        isLoading: false,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const { data } = await axios.post("/api/auth/register", userData);
      return data;
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const { data } = await axios.post("/api/auth/verify-email", {
        email,
        otp,
      });
      return data;
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data } = await axios.put("/api/auth/verify-email", { email });
      return data;
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data } = await axios.post("/api/auth/forgot-password", { email });
      return data;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (resetData: ResetPasswordData) => {
      const { data } = await axios.post("/api/auth/reset-password", resetData);
      return data;
    },
  });

  const resendResetCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data } = await axios.put("/api/auth/reset-password", { email });
      return data;
    },
  });

  const login = async (identifier: string, password: string, captchaAnswer: string, expectedAnswer: number) => {
    await loginMutation.mutateAsync({ identifier, password, captchaAnswer, expectedAnswer });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Clear axios headers
    delete axios.defaults.headers.common["Authorization"];

    // Clear auth state
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });

    // Clear query cache
    queryClient.clear();
  };

  const verifyEmail = async (email: string, otp: string) => {
    await verifyEmailMutation.mutateAsync({ email, otp });
  };

  const resendVerificationEmail = async (email: string) => {
    await resendVerificationMutation.mutateAsync(email);
  };

  const forgotPassword = async (email: string) => {
    await forgotPasswordMutation.mutateAsync(email);
  };

  const resetPassword = async (data: ResetPasswordData) => {
    await resetPasswordMutation.mutateAsync(data);
  };

  const resendResetCode = async (email: string) => {
    await resendResetCodeMutation.mutateAsync(email);
  };

  const value = {
    ...authState,
    login,
    register,
    logout,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    resendResetCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
