/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
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
