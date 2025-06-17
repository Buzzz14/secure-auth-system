import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginAttempt extends Document {
  email: string;
  attempts: number;
  lastAttempt: Date;
  blockedUntil: Date | null;
  isPermanentlyBlocked: boolean;
  resetAttempts(): Promise<void>;
  incrementAttempts(): Promise<void>;
  isBlocked(): boolean;
  getBlockTime(): number | null;
}

const loginAttemptSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  blockedUntil: {
    type: Date,
    default: null,
  },
  isPermanentlyBlocked: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

// Reset attempts after 24 hours
loginAttemptSchema.methods.resetAttempts = async function() {
  const now = new Date();
  const lastAttempt = new Date(this.lastAttempt);
  const hoursSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastAttempt >= 24 && !this.isPermanentlyBlocked) {
    this.attempts = 0;
    this.blockedUntil = null;
    await this.save();
  }
};

// Increment attempts and set block time if needed
loginAttemptSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  this.lastAttempt = new Date();

  // Set block time based on number of attempts
  if (this.attempts >= 10) {
    this.isPermanentlyBlocked = true;
    this.blockedUntil = null;
  } else if (this.attempts === 9) {
    this.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  } else if (this.attempts === 8) {
    this.blockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  } else if (this.attempts === 7) {
    this.blockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  } else if (this.attempts === 6) {
    this.blockedUntil = new Date(Date.now() + 60 * 1000); // 1 minute
  } else if (this.attempts === 5) {
    this.blockedUntil = new Date(Date.now() + 30 * 1000); // 30 seconds
  }

  await this.save();
};

// Check if account is currently blocked
loginAttemptSchema.methods.isBlocked = function(): boolean {
  if (this.isPermanentlyBlocked) return true;
  if (!this.blockedUntil) return false;
  return new Date() < this.blockedUntil;
};

// Get remaining block time in milliseconds
loginAttemptSchema.methods.getBlockTime = function(): number | null {
  if (this.isPermanentlyBlocked) return null;
  if (!this.blockedUntil) return 0;
  const remaining = this.blockedUntil.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
};

export const LoginAttempt = mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>('LoginAttempt', loginAttemptSchema); 