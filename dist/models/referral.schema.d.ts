import mongoose from 'mongoose';
export type ReferralInfo = {
    userId: string;
    referralCode: string;
    referredBy: string;
    generatedAt: Date;
    appliedAt: Date;
};
export type ReferralInfoDocument = ReferralInfo & mongoose.Document;
export declare const ReferralInfoSchema: mongoose.Schema<ReferralInfoDocument, mongoose.Model<ReferralInfoDocument, any, any, any, mongoose.Document<unknown, any, ReferralInfoDocument> & ReferralInfo & mongoose.Document<any, any, any> & {
    _id: mongoose.Types.ObjectId;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, ReferralInfoDocument, mongoose.Document<unknown, {}, mongoose.FlatRecord<ReferralInfoDocument>> & mongoose.FlatRecord<ReferralInfoDocument> & {
    _id: mongoose.Types.ObjectId;
}>;
