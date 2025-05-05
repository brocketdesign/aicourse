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
  progress: { courseId: Types.ObjectId; completedLessons: Types.ObjectId[] }[]; // Array of sub-schema structure
  subscription?: ISubscription;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the structure for progress within a single course
const CourseProgressSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }] // Array of completed Lesson ObjectIds
}, { _id: false }); // Don't create a separate _id for this subdocument

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
  progress: {
    type: [CourseProgressSchema],
    default: []
  },
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
UserSchema.index({ 'progress.courseId': 1 }); // Add index for faster progress lookup

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);