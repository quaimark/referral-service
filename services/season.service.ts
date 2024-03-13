import { globalState } from '../globalState';
import { SeasonDocument } from '../models';
import { DatabaseService } from './database.service';

export class SeasonService {
  constructor(private readonly db: DatabaseService) {}

  async getSeasonByTime(time: Date): Promise<SeasonDocument | null> {
    return await this.db.seasonModel.findOne({
      startAt: { $lte: time },
      $or: [{ endAt: null }, { endAt: { $gte: time } }],
    });
  }

  async getFirstSeason(): Promise<SeasonDocument | null> {
    return await this.db.seasonModel.findOne().sort({ startAt: 1 }).exec();
  }

  async getOrCreateCurrentSeason(): Promise<SeasonDocument> {
    let season = await this.db.seasonModel.findOne({ endAt: null }).exec();
    if (!season) {
      const latestSeason = await this.db.seasonModel
        .findOne()
        .sort({ startAt: -1 })
        .exec();
      season = await this.db.seasonModel.create({
        ...globalState.defaultSeason,
        seasonNumber: latestSeason ? latestSeason.seasonNumber + 1 : 1,
        startAt: latestSeason?.endAt || new Date(),
      });
    }
    return season;
  }
}
