import mongoose, { Schema, Document, Types } from 'mongoose';

// Module schema - embedded in Course
interface IModule {
  title: string;
  description: string;
  order: number;
  lessons: ILesson[];
}

// Lesson schema - embedded in Module
interface ILesson {
  title: string;
  description: string;
  content: string;
  contentType: 'text' | 'video' | 'audio' | 'quiz' | 'code' | 'chat';
  mediaUrl?: string;
  order: number;
  duration?: number; // in minutes
  isPublished: boolean;
}

// Course schema
export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  price: number;
  stripePriceId?: string;
  stripeProductId?: string;
  authors: Types.ObjectId[];
  modules: IModule[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  prerequisites?: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // Total duration in minutes
  featured: boolean;
  enrollmentCount: number;
}

const LessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  contentType: { 
    type: String, 
    required: true, 
    enum: ['text', 'video', 'audio', 'quiz', 'code', 'chat'] 
  },
  mediaUrl: { type: String },
  order: { type: Number, required: true },
  duration: { type: Number },
  isPublished: { type: Boolean, default: false }
});

const ModuleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true },
  lessons: [LessonSchema]
});

const CourseSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  coverImage: { type: String, required: true },
  price: { type: Number, required: true },
  stripePriceId: { type: String },
  stripeProductId: { type: String },
  authors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  modules: [ModuleSchema],
  isPublished: { type: Boolean, default: false },
  prerequisites: [{ type: String }],
  level: { 
    type: String, 
    required: true, 
    enum: ['beginner', 'intermediate', 'advanced'] 
  },
  duration: { type: Number },
  featured: { type: Boolean, default: false },
  enrollmentCount: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Create indexes to optimize queries
// Removed duplicate slug index - the unique:true option already creates an index
CourseSchema.index({ isPublished: 1 });
CourseSchema.index({ featured: 1 });
CourseSchema.index({ authors: 1 });

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);