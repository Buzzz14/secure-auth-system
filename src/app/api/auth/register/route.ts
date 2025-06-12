import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { OTP } from '@/models/OTP';
import { validatePassword, generateOTP } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/mail';
import { message } from 'antd';

export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    try {
      await connectDB();
    } catch (dbError: any) {
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError.message },
        { status: 500 }
      );
    }
    
    const body = await req.json();
    const { firstName, lastName, email, username, password, confirmPassword, captchaAnswer, expectedAnswer } = body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Validate captcha
    if (parseInt(captchaAnswer, 10) !== expectedAnswer) {
      return NextResponse.json(
        { error: 'Invalid captcha answer' },
        { status: 400 }
      );
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password is not strong enough', details: errors },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    try {
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email or username already exists' },
          { status: 400 }
        );
      }
    } catch (userCheckError: any) {
      console.error('User check error:', userCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing user', details: userCheckError.message },
        { status: 500 }
      );
    }
    
    // Create user
    let user;
    try {
      user = await User.create({
        firstName,
        lastName,
        email,
        username,
        password,
      });
    } catch (userCreateError: any) {
      console.error('User creation error:', userCreateError);
      return NextResponse.json(
        { error: 'Failed to create user', details: userCreateError.message },
        { status: 500 }
      );
    }
    
    // Generate and save OTP
    try {
      const otp = generateOTP();
      await OTP.create({
        email,
        otp,
        type: 'EMAIL_VERIFICATION',
      });
      
      // Send verification email
      await sendVerificationEmail(email, otp);
    } catch (otpError: any) {
      console.error('OTP/Email error:', otpError);
      // Don't return error here, user is already created
    }
    
    return NextResponse.json({
      message: 'Registration successful. Please check your email for verification.',
      userId: user._id,
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 