import mongoose from 'mongoose';

/**
 * Season schema
 * @param seasonNumber - season number
 * @param name - season name
 * @param startAt - season start time
 * @param endAt - season end time
 * @param pointTradeVolumeRatio - point = volume * ratio | ex: 10 ~ 1000%
 * @param membershipPlusVolumeRatio - point = volume * ratio | ex: 0.1 ~ 10%
 * @param refTradePointRatio - plus point for ref when they make a buy = volume * ratio | ex: 0.1 ~ 10%
 * @param sponsorTradePointRatio - plus point for sponsor when ref make a buy point = volume * ratio | ex: 0.1 ~ 10%
 * @param membershipShareFeeRatio - fee = fee * ratio | ex: 0.05 ~ 5%
 * @param chain - chain name
 * @returns Season schema
 */
export type Season = {
  seasonNumber: number; // season number
  name?: string; // season name
  startAt?: Date; // season start time
  endAt?: Date; // season end time
  pointTradeVolumeRatio: number; // point = volume * ratio | ex: 10 ~ 1000%
  membershipPlusVolumeRatio: number; // point = volume * ratio | ex: 0.1 ~ 10%
  refTradePointRatio: number; // plus point for ref when they make a buy = volume * ratio | ex: 0.1 ~ 10%
  sponsorTradePointRatio: number; // plus point for sponsor when ref make a buy point = volume * ratio | ex: 0.1 ~ 10%
  membershipShareFeeRatio: number; // fee = fee * ratio | ex: 0.05 ~ 5%
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
  sponsorTradePointRatio: Number,
});
