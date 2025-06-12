'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { EmailVerification } from '@/components/auth/EmailVerification';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  
  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Verification Link</h1>
          <p className="mt-2 text-gray-600">
            Please request a new verification email from the{' '}
            <a href="/auth/login" className="text-blue-600 hover:text-blue-800">
              login page
            </a>
            .
          </p>
        </div>
      </div>
    );
  }
  
  const handleSuccess = () => {
    setTimeout(() => {
      router.push('/auth/login');
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <EmailVerification email={email} onSuccess={handleSuccess} />
    </div>
  );
} 