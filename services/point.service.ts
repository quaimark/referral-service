import {
  PointHistory,
  PointHistoryDocument,
  Season,
  SeasonDocument,
} from 'models';
import {
  BaseQueryParams,
  BaseResultPagination,
  CollectionName,
  GetTopPointParams,
  PaginationDto,
  TopByRefDto,
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
        user: t._id.toString(),
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
      addPointForMembership?: boolean;
      addPointForSponsor?: boolean;
      addPointForReferral?: boolean;
      addPointForSeller?: boolean;
      plusPercent?: number;
    },
    passSeason?: Season,
  ) {
    const fee = h.fee;
    const isMemberShip = h.addPointForMembership;
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

    // add point for membership
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

    // add point for referral
    if (
      h.addPointForReferral &&
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
    const refSource = [];
    if (
      h.addPointForSponsor &&
      season.sponsorTradePointRatio &&
      season.sponsorTradePointRatio > 0
    ) {
      const refUser = userInfo?.referredBy
        ? await this.db.referralInfoModel.findOne({
            referralCode: userInfo.referredBy,
          })
        : undefined;
      if (!refUser) return;
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

    if (h.addPointForSeller) {
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

    if (h.plusPercent && h.plusPercent > 0) {
      for (const d of bulkWrite) {
        const data: PointHistory = d.updateOne.update;
        const pointPlus = data.source[0].point * h.plusPercent;
        data.point = data.point + pointPlus;
        data.source.push({
          type: 'plus',
          point: pointPlus,
        });
      }
    }
    return await this.db.pointHistoryModel.bulkWrite(bulkWrite);
  }

  async topByRefCode(param: BaseQueryParams) {
    const result = new BaseResultPagination<TopByRefDto>();
    const { page, skipIndex, size } = param;
    const data: {
      _id: string;
      user: string;
      count: number;
    }[] = await this.db.referralInfoModel.aggregate([
      {
        $match: { referredBy: { $ne: null } },
      },
      {
        $group: {
          _id: '$referredBy',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      { $skip: skipIndex },
      { $limit: size },
      {
        $lookup: {
          from: 'referral_infos',
          localField: '_id',
          foreignField: 'referralCode',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: '$_id',
          user: '$user.userId',
          count: '$count',
        },
      },
    ]);
    const total = data.length;
    result.data = new PaginationDto<TopByRefDto>(
      data.map((t) => ({
        user: t.user,
        count: t.count,
        refCode: t._id,
      })),
      total,
      page,
      size,
    );
    return result;
  }

  async userRefStats(
    userId: string,
    rankBy: 'countRef' | 'total' | 'count' = 'countRef',
  ): Promise<{
    id: string;
    total: number;
    ranking: number;
    count: number;
    countRef: number;
    allRef: number;
  }> {
    const total = await this.db.pointHistoryModel.countDocuments({
      user: userId,
      ref: { $ne: null },
    });
    const refInfo = await this.db.referralInfoModel.findOne({ userId });
    const allRef = await this.db.referralInfoModel.countDocuments({
      referredBy: refInfo.referralCode,
    });
    if (!total)
      return {
        id: userId,
        total,
        ranking: -1,
        count: 0,
        countRef: 0,
        allRef,
      };

    const ranking: {
      _id: string;
      total: number; // total point
      ranking: number; // ranking
      count: number; // total trade count
      countRef: number; // total ref count has trade
    }[] = await this.db.pointHistoryModel.aggregate([
      {
        $match: {
          ref: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            user: '$user',
            ref: '$ref',
          },
          total: {
            $sum: '$point',
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: '$_id.user',
          countRef: {
            $sum: 1,
          },
          total: {
            $sum: '$total',
          },
          count: {
            $sum: '$count',
          },
        },
      },
      {
        $sort: {
          [rankBy]: -1,
        },
      },
      {
        $setWindowFields: {
          partitionBy: null,
          sortBy: { [rankBy]: -1 },
          output: { ranking: { $denseRank: {} } },
        },
      },
      {
        $match: {
          _id: userId,
        },
      },
    ]);
    const rs =
      ranking.length > 0
        ? { ...ranking[0], id: userId }
        : { id: userId, total, ranking: -1, count: 0, countRef: 0 };
    return {
      ...rs,
      allRef,
    };
  }
}
