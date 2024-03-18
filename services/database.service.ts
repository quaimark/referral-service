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
    private readonly dbName?: string,
  ) {
    const connectWithRetry = async () => {
      try {
        this.connection = await mongoose
          .createConnection(this.connectionString, {
            dbName: this.dbName,
          })
          .asPromise();
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
      } catch (error) {
        console.error(
          'Failed to connect to mongo on startup - retrying in 5 sec',
          error,
        );
        setTimeout(connectWithRetry, 5000);
      }
    };
    connectWithRetry();
  }
  waitForConnection() {
    return new Promise((resolve) => {
      if (this.connection) {
        resolve(true);
      } else {
        setTimeout(() => {
          this.waitForConnection().then(resolve);
        }, 1000);
      }
    });
  }
  public connection: mongoose.Connection;
  public pointHistoryModel: mongoose.Model<PointHistoryDocument>;
  public seasonModel: mongoose.Model<SeasonDocument>;
  public referralInfoModel: mongoose.Model<ReferralInfoDocument>;
}
