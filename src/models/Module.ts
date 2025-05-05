import mongoose, { Document, Schema, Types } from 'mongoose';
import Lesson from './Lesson'; // Import Lesson model for cascading delete

export interface IModule extends Document {
  title: string;
  description: string;
  order: number;
  course: Types.ObjectId; // Reference to the Course
  lessons: Types.ObjectId[]; // References to Lessons
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Module description is required'],
  },
  order: {
    type: Number,
    required: [true, 'Module order is required'],
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  lessons: [{ // Add lessons array
    type: Schema.Types.ObjectId,
    ref: 'Lesson'
  }]
}, { timestamps: true });

// Middleware to handle cascading delete of lessons when a module is deleted
ModuleSchema.pre('findOneAndDelete', { document: false, query: true }, async function(next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await Lesson.deleteMany({ module: doc._id });
  }
  next();
});


// Ensure the model is not already defined before defining it
export default mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);
