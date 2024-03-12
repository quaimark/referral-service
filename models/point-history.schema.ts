import { ObjectId, Schema } from 'mongoose';
import { SeasonDocument } from './season.schema';
import { CollectionName } from '../types';

export type PointSource = {
  type: string;
  point: number;
};

export type PointHistory = {
  txHash: string;
  block: number;
  blockTime: number;
  point: number;
  source?: PointSource[];
  fee: number;
  volume: number;
  chain: string;
  user: string;
  ref?: string;
  season?: SeasonDocument | ObjectId;
};

export type PointHistoryDocument = PointHistory & Document;

export const PointHistorySchema = new Schema<PointHistoryDocument>(
  {
    txHash: String,
    block: Number,
    blockTime: Number,
    point: Number,
    source: [Object],
    fee: Number,
    volume: Number,
    chain: String,
    user: String,
    ref: String,
    season: { type: Schema.Types.ObjectId, ref: CollectionName.Season },
  },
  {
    timestamps: true,
    autoIndex: true,
  },
);

PointHistorySchema.index({ user: 1 });
PointHistorySchema.index({ ref: 1 });
PointHistorySchema.index({ blockTime: 1 });
PointHistorySchema.index({ 'source.type': 1 });
