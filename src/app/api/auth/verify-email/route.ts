import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { OTP } from '@/models/OTP';
import { generateOTP } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { email, otp } = body;
    
    // Validate required fields
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }
    
    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'EMAIL_VERIFICATION',
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }
    
    // Update user's email verification status
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    user.isEmailVerified = true;
    await user.save();
    
    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    
    return NextResponse.json({
      message: 'Email verified successfully',
    });
    
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint to resend verification OTP
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
    
    // Check if user exists and needs verification
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }
    
    // Delete any existing OTPs for this email
    await OTP.deleteMany({
      email,
      type: 'EMAIL_VERIFICATION'
    });
    
    // Generate and save new OTP
    const otp = generateOTP();
    await OTP.create({
      email,
      otp,
      type: 'EMAIL_VERIFICATION'
    });
    
    // Send new verification email
    await sendVerificationEmail(email, otp);
    
    return NextResponse.json({
      message: 'Verification email sent successfully',
    });
    
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 