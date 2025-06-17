import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { OTP } from '@/models/OTP';
import { validatePassword, generateOTP } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mail';
import { isStrongPassword } from '@/utils/security';
import bcrypt from 'bcrypt';

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
    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        { error: 'Password does not meet strength requirements' },
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
    
    // Check if new password is in history
    const isInHistory = await Promise.all(
      user.passwordHistory.map(async (oldPassword: string) => {
        return bcrypt.compare(newPassword, oldPassword);
      })
    );

    if (isInHistory.some(Boolean)) {
      return NextResponse.json(
        { error: 'New password cannot be the same as any of your last 5 passwords' },
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

// Endpoint to resend reset code
export async function PUT(req: Request) {
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
      message: 'Reset code has been sent to your email',
    });
    
  } catch (error: any) {
    console.error('Error in resend reset code:', error);
    return NextResponse.json(
      { error: 'Failed to send reset code' },
      { status: 500 }
    );
  }
} 