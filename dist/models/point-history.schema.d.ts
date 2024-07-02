import { Schema } from 'mongoose';
import { SeasonDocument } from './season.schema';
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
    fee?: number;
    volume: number;
    chain: string;
    user: string;
    ref?: string;
    historyId: string;
    season?: SeasonDocument;
};
export type PointHistoryDocument = PointHistory & Document;
export declare const PointHistorySchema: Schema<PointHistoryDocument, import("mongoose").Model<PointHistoryDocument, any, any, any, import("mongoose").Document<unknown, any, PointHistoryDocument> & PointHistory & Document & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PointHistoryDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PointHistoryDocument>> & import("mongoose").FlatRecord<PointHistoryDocument> & {
    _id: import("mongoose").Types.ObjectId;
}>;
