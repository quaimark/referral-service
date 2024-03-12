import mongoose from 'mongoose';

export type Season = {
  seasonNumber: number;
  name: string;
  startAt: Date; //block number
  endAt?: Date; //block number
  pointTradeVolumeRatio: number; // point = volume * ratio | ex: 10 ~ 1000%
  membershipPlusVolumeRatio: number; // point = volume * ratio | ex: 0.1 ~ 10%
  refTradePointRatio: number; // point = volume * ratio | ex: 0.1 ~ 10%
  membershipShareFeeRatio: number; // point = volume * ratio | ex: 0.05 ~ 5%
};

export type SeasonDocument = Season & mongoose.Document;

export const SeasonSchema = new mongoose.Schema<SeasonDocument>({
  seasonNumber: Number,
  name: String,
  startAt: Date,
  endAt: Date,
  pointTradeVolumeRatio: Number,
  membershipPlusVolumeRatio: Number,
  refTradePointRatio: Number,
  membershipShareFeeRatio: Number,
});
