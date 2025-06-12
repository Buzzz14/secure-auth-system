import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { generateToken } from '@/lib/auth';
import { OTP } from '@/models/OTP';
import { generateOTP } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { identifier, password } = body;    
    // Validate required fields
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check password first before proceeding with email verification
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      
      // Delete any existing verification OTPs
      await OTP.deleteMany({
        email: user.email,
        type: 'EMAIL_VERIFICATION'
      });
      
      // Generate and save new OTP
      const otp = generateOTP();
      await OTP.create({
        email: user.email,
        otp,
        type: 'EMAIL_VERIFICATION'
      });
      
      // Send new verification email
      await sendVerificationEmail(user.email, otp);
      
      return NextResponse.json(
        {
          error: 'Please verify your email before logging in',
          requiresVerification: true,
          email: user.email
        },
        { status: 403 }
      );
    }
    
    // Check if password needs to be changed
    const passwordAge = Date.now() - user.passwordLastChanged.getTime();
    const daysOld = passwordAge / (1000 * 60 * 60 * 24);
    const passwordExpired = daysOld >= 90;
    
    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });
    
    const response = {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
      },
      passwordExpired,
    };
    return NextResponse.json(response);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 