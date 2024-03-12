import mongoose from 'mongoose';

export type ReferralInfo = {
  userId: string;
  referralCode: string;
  referredBy: string;
  generatedAt: Date;
  appliedAt: Date;
};

export type ReferralInfoDocument = ReferralInfo & mongoose.Document;

export const ReferralInfoSchema = new mongoose.Schema<ReferralInfoDocument>(
  {
    userId: String,
    referralCode: String,
    referredBy: String,
    generatedAt: Date,
    appliedAt: Date,
  },
  {
    timestamps: true,
    autoIndex: true,
  },
);
ReferralInfoSchema.index({ userId: 1 }, { unique: true });
ReferralInfoSchema.index({ referralCode: 1 }, { unique: true });
ReferralInfoSchema.index({ referredBy: 1 });
