import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { LoginAttempt } from '@/models/LoginAttempt';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { identifier, password, captchaAnswer, expectedAnswer } = await request.json();

    // Validate captcha
    if (captchaAnswer !== expectedAnswer.toString()) {
      return NextResponse.json(
        { error: 'Invalid captcha answer' },
        { status: 400 }
      );
    }

    await connectToDatabase();

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

    // Check login attempts
    let loginAttempt = await LoginAttempt.findOne({ email: user.email });
    if (!loginAttempt) {
      loginAttempt = await LoginAttempt.create({ email: user.email });
    }

    // Reset attempts if 24 hours have passed
    await loginAttempt.resetAttempts();

    // Check if account is blocked
    if (loginAttempt.isBlocked()) {
      const blockTime = loginAttempt.getBlockTime();
      if (blockTime === null) {
        return NextResponse.json(
          { error: 'Account is permanently blocked due to too many failed attempts. Please contact support.' },
          { status: 403 }
        );
      }

      const minutes = Math.ceil(blockTime / (1000 * 60));
      return NextResponse.json(
        { error: `Account is temporarily blocked. Please try again in ${minutes} minutes.` },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      await loginAttempt.incrementAttempts();
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await loginAttempt.incrementAttempts();
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset attempts on successful login
    loginAttempt.attempts = 0;
    loginAttempt.blockedUntil = null;
    await loginAttempt.save();

    // Check if password is expired
    if (user.isPasswordExpired()) {
      return NextResponse.json(
        { 
          error: 'Password has expired',
          requiresPasswordChange: true,
          message: 'Please change your password to continue'
        },
        { status: 403 }
      );
    }

    // Check if password needs renewal
    if (user.needsPasswordRenewal()) {
      return NextResponse.json(
        { 
          warning: 'Password will expire soon',
          requiresPasswordChange: true,
          message: 'Please change your password within 7 days'
        },
        { status: 200 }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user details and token
    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 