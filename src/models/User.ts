import mongoose, { Schema, Document, Types } from 'mongoose';

// User Progress tracking within courses
interface IProgress {
  courseId: Types.ObjectId;
  completedLessons: string[]; // Lesson IDs
  lastAccessedLesson: string; // Lesson ID
  lastAccessedAt: Date;
  quizScores: {
    lessonId: string;
    score: number;
    maxScore: number;
  }[];
}

// Subscription details
interface ISubscription {
  stripePriceId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date;
}

export interface IUser extends Document {
  clerkId: string; // External ID from Clerk
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  role: 'student' | 'admin' | 'instructor';
  enrolledCourses: Types.ObjectId[];
  progress: IProgress[];
  subscription?: ISubscription;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: String }],
  lastAccessedLesson: { type: String },
  lastAccessedAt: { type: Date },
  quizScores: [{
    lessonId: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true }
  }]
});

const SubscriptionSchema = new Schema({
  stripePriceId: { type: String, required: true },
  stripeSubscriptionId: { type: String, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['active', 'canceled', 'past_due', 'trialing']
  },
  currentPeriodEnd: { type: Date, required: true }
});

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  imageUrl: { type: String },
  role: { 
    type: String, 
    required: true, 
    enum: ['student', 'admin', 'instructor'],
    default: 'student'
  },
  enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  progress: [ProgressSchema],
  subscription: SubscriptionSchema,
  lastLogin: { type: Date, default: Date.now },
}, { 
  timestamps: true 
});

// Create indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscription.status': 1 });
UserSchema.index({ enrolledCourses: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);