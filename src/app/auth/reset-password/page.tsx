'use client';

import { useSearchParams } from 'next/navigation';
import { ResetPassword } from '@/components/auth/ResetPassword';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Reset Link</h1>
          <p className="mt-2 text-gray-600">
            Please request a new password reset from the{' '}
            <a href="/auth/forgot-password" className="text-blue-600 hover:text-blue-800">
              forgot password page
            </a>
            .
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ResetPassword email={email} />
    </div>
  );
} 