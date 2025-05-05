import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  content?: string; // Content can be markdown, video URL, etc.
  order: number;
  module: Types.ObjectId; // Reference to the Module
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
  },
  content: {
    type: String,
  },
  order: {
    type: Number,
    required: [true, 'Lesson order is required'],
  },
  module: {
    type: Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
}, { timestamps: true });

// Ensure the model is not already defined before defining it
export default mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);
