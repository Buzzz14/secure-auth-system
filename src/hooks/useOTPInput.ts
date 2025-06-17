import { UseOTPInput } from "@/types";
import { useState, useEffect, useCallback } from "react";

export function useOTPInput(
  length: number = 6,
  cooldownTime: number = 60
): UseOTPInput {
  const [otp, setOTPArray] = useState<string[]>(new Array(length).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const setOTP = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    setOTPArray((prev) => {
      const newOTP = [...prev];
      newOTP[index] = value.slice(-1);
      return newOTP;
    });

    if (value && index < length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      const target = e.target as HTMLInputElement;

      if (e.key === "Backspace") {
        if (target.value === "") {
          setOTPArray((prev) => {
            const newOTP = [...prev];
            newOTP[Math.max(0, index - 1)] = "";
            return newOTP;
          });

          // Focus previous input
          const prevInput = target.previousElementSibling as HTMLInputElement;
          if (prevInput) {
            prevInput.focus();
          }
        }
      }

      // else if (e.key >= '0' && e.key <= '9') {
      //   setOTPArray((prev) => {
      //     const newOTP = [...prev];
      //     newOTP[index] = e.key;
      //     return newOTP;
      //   });

      //   // Focus next input
      //   const nextInput = target.nextElementSibling as HTMLInputElement;
      //   if (nextInput) {
      //     nextInput.focus();
      //   }
      // }
    },
    []
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (!pasted) return;

      const newOtp = new Array(length).fill("");
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOTPArray(newOtp);

      // Focus the next empty input
      const nextIndex = pasted.length >= length ? length - 1 : pasted.length;
      const nextInput = document.getElementById(
        `otp-${nextIndex}`
      ) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    },
    [length]
  );

  const startCooldown = useCallback(() => {
    setCanResend(false);
    setCooldown(cooldownTime);
  }, [cooldownTime]);

  const getOTPString = useCallback(() => {
    return otp.join("");
  }, [otp]);

  return {
    otp,
    cooldown,
    canResend,
    setOTP,
    handlePaste,
    handleKeyDown,
    startCooldown,
    getOTPString,
  };
}
