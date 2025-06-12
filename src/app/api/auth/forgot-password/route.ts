import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { OTP } from '@/models/OTP';
import { generateOTP } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }
    
    // Delete any existing password reset OTPs
    await OTP.deleteMany({
      email,
      type: 'PASSWORD_RESET'
    });
    
    // Generate and save new OTP
    const otp = generateOTP();
    await OTP.create({
      email,
      otp,
      type: 'PASSWORD_RESET'
    });
    
    // Send password reset email
    await sendPasswordResetEmail(email, otp);
    
    return NextResponse.json({
      message: 'Password reset instructions sent to your email',
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 