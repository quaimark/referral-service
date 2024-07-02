import mongoose from 'mongoose';
export type Season = {
    seasonNumber: number;
    name?: string;
    startAt?: Date;
    endAt?: Date;
    pointTradeVolumeRatio: number;
    membershipPlusVolumeRatio: number;
    refTradePointRatio: number;
    sponsorTradePointRatio: number;
    membershipShareFeeRatio: number;
};
export type SeasonDocument = Season & mongoose.Document;
export declare const SeasonSchema: mongoose.Schema<SeasonDocument, mongoose.Model<SeasonDocument, any, any, any, mongoose.Document<unknown, any, SeasonDocument> & Season & mongoose.Document<any, any, any> & {
    _id: mongoose.Types.ObjectId;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, SeasonDocument, mongoose.Document<unknown, {}, mongoose.FlatRecord<SeasonDocument>> & mongoose.FlatRecord<SeasonDocument> & {
    _id: mongoose.Types.ObjectId;
}>;
