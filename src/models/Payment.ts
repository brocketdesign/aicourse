import mongoose, { Schema, Document, models, Model } from 'mongoose';

interface IPayment extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  courseId: mongoose.Schema.Types.ObjectId;
  amount: number; // Store amount in cents
  currency: string;
  stripeCheckoutSessionId: string;
  status: 'succeeded' | 'pending' | 'failed';
  createdAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'usd' },
  stripeCheckoutSessionId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['succeeded', 'pending', 'failed'], required: true, default: 'succeeded' },
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexing for faster queries
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ courseId: 1 });
PaymentSchema.index({ createdAt: -1 });

const Payment: Model<IPayment> = models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
export type { IPayment };
