import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

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