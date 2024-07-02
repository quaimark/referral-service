import mongoose from 'mongoose';
import { PointHistoryDocument, ReferralInfoDocument, SeasonDocument } from '../models';
export declare class DatabaseService {
    private readonly connectionString;
    private readonly dbName?;
    constructor(connectionString: string, dbName?: string);
    waitForConnection(): Promise<unknown>;
    connection: mongoose.Connection;
    pointHistoryModel: mongoose.Model<PointHistoryDocument>;
    seasonModel: mongoose.Model<SeasonDocument>;
    referralInfoModel: mongoose.Model<ReferralInfoDocument>;
}
