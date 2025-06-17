import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  isEmailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordLastChanged: Date;
  passwordExpiresAt: Date;
  passwordHistory: string[];
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  isPasswordExpired(): boolean;
  needsPasswordRenewal(): boolean;
}

const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  passwordLastChanged: {
    type: Date,
    default: Date.now,
  },
  passwordExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
  },
  passwordHistory: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update password expiration when password is changed
    if (this.isModified('password')) {
      this.passwordLastChanged = new Date();
      this.passwordExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months
      
      // Add to password history (keep last 5 passwords)
      this.passwordHistory = [this.password, ...this.passwordHistory].slice(0, 5);
    }
    
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was used before
userSchema.methods.isPasswordUsedBefore = async function(newPassword: string): Promise<boolean> {
  for (const oldPassword of this.passwordHistory) {
    if (await bcrypt.compare(newPassword, oldPassword)) {
      return true;
    }
  }
  return false;
};

// Check if password is expired
userSchema.methods.isPasswordExpired = function(): boolean {
  return new Date() > this.passwordExpiresAt;
};

// Check if password needs renewal (within 7 days of expiration)
userSchema.methods.needsPasswordRenewal = function(): boolean {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return this.passwordExpiresAt <= sevenDaysFromNow;
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema); 