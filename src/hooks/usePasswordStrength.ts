import { PasswordStrength } from "@/types";
import { useState, useEffect } from "react";
import zxcvbn from "zxcvbn";

export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: {
      warning: "",
      suggestions: [],
    },
    isStrong: false,
    errors: [],
  });

  useEffect(() => {
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

    if (
      result.feedback.warning &&
      result.feedback.warning.toLowerCase().includes("word")
    ) {
      errors.push(
        "Password contains common dictionary words - try using unique combinations"
      );
    }

    const dictionarySuggestions = result.feedback.suggestions.filter(
      (suggestion) =>
        suggestion.toLowerCase().includes("word") ||
        suggestion.toLowerCase().includes("dictionary") ||
        suggestion.toLowerCase().includes("predictable")
    );

    if (dictionarySuggestions.length > 0) {
      errors.push(...dictionarySuggestions);
    }

    const finalScore =
      errors.length > 0 ? Math.min(result.score, 2) : result.score;

    setStrength({
      score: finalScore,
      feedback: result.feedback,
      isStrong: finalScore >= 3,
      errors,
    });
  }, [password]);

  const getStrengthColor = () => {
    if (password.length === 0) return "gray";
    switch (strength.score) {
      case 0:
        return "red";
      case 1:
        return "orange";
      case 2:
        return "yellow";
      case 3:
        return "lime";
      case 4:
        return "green";
      default:
        return "gray";
    }
  };

  const getStrengthText = () => {
    if (password.length === 0) return "Enter password";
    switch (strength.score) {
      case 0:
        return "Very weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Strong";
      case 4:
        return "Very strong";
      default:
        return "Enter password";
    }
  };

  return {
    strength,
    getStrengthColor,
    getStrengthText,
  };
}
