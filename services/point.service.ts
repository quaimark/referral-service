import {
  PointHistory,
  PointHistoryDocument,
  Season,
  SeasonDocument,
} from 'models';
import {
  BaseQueryParams,
  BaseResultPagination,
  GetTopPointParams,
  PaginationDto,
  TopPointDto,
} from '../types';
import { DatabaseService } from './database.service';
import { SeasonService } from './season.service';

export class PointService {
  constructor(
    private readonly db: DatabaseService,
    private readonly seasonService: SeasonService,
  ) {}

  async getUserPoint(userId: string, seasonNumber?: number): Promise<number> {
    const season = seasonNumber
      ? await this.db.seasonModel.findOne({ seasonNumber })
      : await this.seasonService.getOrCreateCurrentSeason();

    const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
    const to = season.endAt ? new Date(season.endAt) : null;

    const match: any = {
      blockTime: { $gte: from.getTime() },
      user: userId,
    };
    if (to) {
      match.blockTime.$lte = to.getTime();
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
      blockTime: { $gte: from.getTime() },
    };
    if (to) {
      match.blockTime.$lte = to.getTime();
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
      blockTime: { $gte: from.getTime() },
    };
    if (to) {
      match.blockTime.$lte = to.getTime();
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

  /**
   * Calculate point from trade history
   * @param h tx history
   * @param addPointForSeller add point for seller
   * @param passSeason pass season to calculate point
   */
  async pointCalculate(
    h: {
      to: string;
      from: string;
      price: number;
      txHash: string;
      block: number;
      blockTime: Date;
      chain: string;
      fee: number;
      isMembership: boolean;
    },
    addPointForSeller = false,
    passSeason?: Season,
  ) {
    const fee = h.fee;
    const isMemberShip = h.isMembership;
    const pointHistory: PointHistory = {
      user: h.to,
      volume: h.price,
      txHash: h.txHash,
      block: h.block,
      chain: h.chain,
      fee,
      point: 0,
      blockTime: h.blockTime.getTime(),
    };
    
    const season =
      passSeason ||
      (await this.seasonService.getSeasonByTime(
        new Date(pointHistory.blockTime),
      ));
    pointHistory.season = (season as SeasonDocument)?._id?.toString() || null;

    // calculate point for buy user
    const source = [];
    const tradeVolumePoint = pointHistory.volume * season.pointTradeVolumeRatio;
    source.push({
      type: 'buy_volume',
      point: tradeVolumePoint,
    });
    if (isMemberShip) {
      const pointPlus = tradeVolumePoint * season.membershipPlusVolumeRatio;
      source.push({
        type: 'membership',
        point: pointPlus,
      });
    }

    const userInfo = await this.db.referralInfoModel.findOne({
      userId: pointHistory.user,
    });
    if (
      userInfo?.referredBy &&
      season.refTradePointRatio &&
      season.refTradePointRatio > 0
    ) {
      const refPoint = tradeVolumePoint * season.refTradePointRatio;
      source.push({
        type: 'apply_referral',
        point: refPoint,
      });
    }
    pointHistory.source = source;
    pointHistory.point = source.reduce((a, b) => a + b.point, 0);

    const bulkWrite = [];
    bulkWrite.push({
      updateOne: {
        filter: {
          txHash: pointHistory.txHash,
          user: pointHistory.user,
        },
        update: pointHistory,
        upsert: true,
      },
    });

    // add point for sponsor

    const refUser = userInfo?.referredBy
      ? await this.db.referralInfoModel.findOne({
          referralCode: userInfo.referredBy,
        })
      : undefined;
    const refSource = [];
    if (
      refUser &&
      season.sponsorTradePointRatio &&
      season.sponsorTradePointRatio > 0
    ) {
      const refPoint = tradeVolumePoint * season.sponsorTradePointRatio;
      refSource.push({
        type: 'referral',
        point: refPoint,
      });

      const refPointHistory: PointHistory = {
        user: refUser.userId,
        volume: pointHistory.volume,
        txHash: pointHistory.txHash,
        block: pointHistory.block,
        chain: pointHistory.chain,
        fee: pointHistory.fee,
        point: refSource.reduce((a, b) => a + b.point, 0),
        source: refSource,
        ref: pointHistory.user,
        blockTime: pointHistory.blockTime,
        season: pointHistory.season,
      };

      bulkWrite.push({
        updateOne: {
          filter: {
            txHash: refPointHistory.txHash,
            user: refPointHistory.user,
          },
          update: refPointHistory,
          upsert: true,
        },
      });
    }

    if (addPointForSeller) {
      const sellerPointHistory: PointHistory = {
        user: h.from,
        volume: pointHistory.volume,
        txHash: pointHistory.txHash,
        block: pointHistory.block,
        chain: pointHistory.chain,
        fee: pointHistory.fee,
        point: tradeVolumePoint,
        source: [
          {
            point: tradeVolumePoint,
            type: 'sell_volume',
          },
        ],
        blockTime: pointHistory.blockTime,
        season: pointHistory.season,
      };
      bulkWrite.push({
        updateOne: {
          filter: {
            txHash: sellerPointHistory.txHash,
            user: sellerPointHistory.user,
          },
          update: sellerPointHistory,
          upsert: true,
        },
      });
    }

    return await this.db.pointHistoryModel.bulkWrite(bulkWrite);
  }
}
