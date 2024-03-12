import mongoose from 'mongoose';
import {
  PointHistoryDocument,
  PointHistorySchema,
  ReferralInfoDocument,
  ReferralInfoSchema,
  SeasonDocument,
  SeasonSchema,
} from '../models';
import { CollectionName } from '../types';

export class DatabaseService {
  constructor(
    private readonly connectionString: string,
    dbName?: string,
  ) {
    this.connection = mongoose.createConnection(this.connectionString, {
      dbName,
    });
    this.pointHistoryModel = this.connection.model<PointHistoryDocument>(
      CollectionName.PointHistory,
      PointHistorySchema,
    );
    this.seasonModel = this.connection.model<SeasonDocument>(
      CollectionName.Season,
      SeasonSchema,
    );
    this.referralInfoModel = this.connection.model<ReferralInfoDocument>(
      CollectionName.ReferralInfo,
      ReferralInfoSchema,
    );
  }
  public connection: mongoose.Connection;
  public pointHistoryModel: mongoose.Model<PointHistoryDocument>;
  public seasonModel: mongoose.Model<SeasonDocument>;
  public referralInfoModel: mongoose.Model<ReferralInfoDocument>;
}
