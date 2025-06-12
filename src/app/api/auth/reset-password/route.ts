import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { OTP } from '@/models/OTP';
import { validatePassword } from '@/lib/auth';
import { message } from 'antd';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { email, otp, newPassword, confirmPassword } = body;
    
    // Validate required fields
    if (!email || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    const { isValid, errors } = validatePassword(newPassword);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password is not strong enough', details: errors },
        { status: 400 }
      );
    }
    
    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'PASSWORD_RESET',
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }
    
    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the new password was used before
    const wasUsedBefore = await user.isPasswordUsedBefore(newPassword);
    if (wasUsedBefore) {
      return NextResponse.json(
        { error: 'This password was used recently. Please choose a different password.' },
        { status: 400 }
      );
    }
    
    // Update password and password change date
    user.password = newPassword;
    user.passwordLastChanged = new Date();
    await user.save();
    
    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    
    return NextResponse.json({
      message: 'Password reset successful',
    });
    
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 