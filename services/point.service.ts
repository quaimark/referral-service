import {
  BaseQueryParams,
  BaseResultPagination,
  GetTopPointParams,
  PaginationDto,
  TopPointDto,
} from '../types';
import { DatabaseService } from './database.service';
import { SeasonService } from './season.service';
import { PointHistoryDocument } from 'models';

export class PointService {
  constructor(private readonly db: DatabaseService) {
    this.seasonService = new SeasonService(db);
  }
  seasonService: SeasonService;

  async getUserPoint(userId: string, seasonNumber?: number): Promise<number> {
    const season = seasonNumber
      ? await this.db.seasonModel.findOne({ seasonNumber })
      : await this.seasonService.getOrCreateCurrentSeason();

    const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
    const to = season.endAt ? new Date(season.endAt) : null;

    const match: any = {
      blockTime: { $gte: parseInt(String(from.getTime() / 1000)) },
      user: userId,
    };
    if (to) {
      match.blockTime.$lte = parseInt(String(to.getTime() / 1000));
    }

    const point = await this.db.pointHistoryModel.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: null,
          point: { $sum: '$point' },
        },
      },
    ]);
    return point[0]?.point || 0;
  }

  async getUserRanking(
    userId: string,
    seasonNumber?: number,
  ): Promise<{
    ranking: number;
    seasonPoint?: number;
    tradePoint?: number;
    refPoint?: number;
  }> {
    const season = seasonNumber
      ? await this.db.seasonModel.findOne({ seasonNumber })
      : await this.seasonService.getOrCreateCurrentSeason();

    const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
    const to = season.endAt ? new Date(season.endAt) : null;

    const match: any = {
      blockTime: { $gte: parseInt(String(from.getTime() / 1000)) },
    };
    if (to) {
      match.blockTime.$lte = parseInt(String(to.getTime() / 1000));
    }

    const total = await this.db.pointHistoryModel.countDocuments({
      user: userId,
      ...match,
    });
    if (!total)
      return {
        ranking: -1,
      };
    const topPoints: {
      _id: string;
      ranking: number;
      seasonPoint: number;
      tradePoint: number;
      refPoint: number;
    }[] = await this.db.pointHistoryModel.aggregate([
      {
        $match: match,
      },
      { $unwind: '$source' },
      {
        $group: {
          _id: '$user',
          seasonPoint: { $sum: '$point' },
          tradePoint: {
            $sum: {
              $cond: [
                { $in: ['$source.type', ['sell_volume', 'buy_volume']] },
                '$point',
                0,
              ],
            },
          },
          refPoint: {
            $sum: {
              $cond: [{ $eq: ['$source.type', 'referral'] }, '$point', 0],
            },
          },
        },
      },
      {
        $sort: {
          seasonPoint: -1,
        },
      },
      {
        $setWindowFields: {
          partitionBy: null,
          sortBy: { seasonPoint: -1 },
          output: { ranking: { $denseRank: {} } },
        },
      },
      { $match: { _id: userId } },
      { $project: { ranking: 1, seasonPoint: 1, tradePoint: 1, refPoint: 1 } }, // Include both fields
    ]);
    topPoints.length > 0 && delete topPoints[0]._id;

    return topPoints.length > 0 ? topPoints[0] : { ranking: -1 };
  }

  async userPointHistory(
    userId: string,
    query: BaseQueryParams,
  ): Promise<BaseResultPagination<PointHistoryDocument>> {
    const result = new BaseResultPagination<PointHistoryDocument>();
    const { page, skipIndex, size } = query;
    const data = await this.db.pointHistoryModel
      .find({ user: userId })
      .sort({ blockTime: -1 })
      .skip(skipIndex)
      .limit(size)
      .populate('season');
    const total = await this.db.pointHistoryModel.countDocuments({
      user: userId,
    });
    result.data = new PaginationDto<PointHistoryDocument>(
      data,
      total,
      page,
      size,
    );
    return result;
  }

  async getTopPoints(
    param: GetTopPointParams,
  ): Promise<BaseResultPagination<TopPointDto>> {
    const season = param.seasonNumber
      ? await this.db.seasonModel.findOne({ seasonNumber: param.seasonNumber })
      : await this.seasonService.getOrCreateCurrentSeason();

    const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
    const to = season.endAt ? new Date(season.endAt) : null;

    const match: any = {
      blockTime: { $gte: parseInt(String(from.getTime() / 1000)) },
    };
    if (to) {
      match.blockTime.$lte = parseInt(String(to.getTime() / 1000));
    }
    const topPoints: {
      seasonPoint: number;
      _id: string;
      tradePoint: number;
      refPoint: number;
    }[] = await this.db.pointHistoryModel.aggregate([
      {
        $match: match,
      },
      { $unwind: '$source' },
      {
        $group: {
          _id: '$user',
          seasonPoint: { $sum: '$point' },
          tradePoint: {
            $sum: {
              $cond: [
                { $in: ['$source.type', ['sell_volume', 'buy_volume']] },
                '$point',
                0,
              ],
            },
          },
          refPoint: {
            $sum: {
              $cond: [{ $eq: ['$source.type', 'referral'] }, '$point', 0],
            },
          },
        },
      },
      {
        $sort: {
          seasonPoint: -1,
        },
      },
      { $skip: param.skipIndex },
      { $limit: param.size },
    ]);
    const result = new BaseResultPagination<TopPointDto>();

    result.data = new PaginationDto<TopPointDto>(
      topPoints.map((t) => ({
        user: t._id,
        seasonPoint: t.seasonPoint,
        referralPoint: t.refPoint,
        tradingPoint: t.tradePoint,
      })),
      topPoints.length,
      param.page,
      param.size,
    );
    return result;
  }
}
