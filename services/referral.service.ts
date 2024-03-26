import { BaseQueryParams, BaseResultPagination, PaginationDto } from '../types';
import { ReferralInfoDocument } from '../models';
import { DatabaseService } from './database.service';
import crypto from 'node:crypto';

export class ReferralService {
  constructor(private readonly db: DatabaseService) {}

  async getReferralInfoByUserId(userId: string): Promise<ReferralInfoDocument> {
    const refInfo = await this.db.referralInfoModel.findOne({ userId }).exec();
    if (refInfo?.referralCode) {
      return refInfo;
    }

    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    const ref = 'REF-' + hash.substring(0, 8);

    return await this.db.referralInfoModel
      .findOneAndUpdate(
        { userId },
        {
          $set: { referralCode: ref },
          $setOnInsert: { userId, generatedAt: new Date() },
        },
        { new: true, upsert: true },
      )
      .exec();
  }

  async getUserByRefCode(
    refCode: string,
  ): Promise<ReferralInfoDocument | null> {
    return await this.db.referralInfoModel
      .findOne({ referralCode: refCode })
      .exec();
  }

  async addRefBy(
    userId: string,
    refCode: string,
  ): Promise<ReferralInfoDocument> {
    if (!refCode) {
      throw new Error('refCode is required');
    }
    const user = await this.getReferralInfoByUserId(userId);
    if (user.referredBy) {
      throw new Error('user has refBy');
    }
    const refByUser = await this.db.referralInfoModel
      .findOne({ referralCode: refCode })
      .exec();
    if (!refByUser) {
      throw new Error('refBy user is not found');
    }
    if (refByUser.userId === userId) {
      throw new Error('user cannot ref by himself');
    }

    let refTreeUser: ReferralInfoDocument | null = refByUser;
    while (!!refTreeUser?.referredBy) {
      if (refTreeUser.referredBy === user.referralCode) {
        throw new Error('user cannot ref by himself');
      }
      refTreeUser = await this.db.referralInfoModel.findOne({
        referralCode: refTreeUser.referredBy,
      });
    }

    const ref = await this.db.referralInfoModel.findOneAndUpdate(
      {
        userId,
      },
      {
        $set: {
          referredBy: refCode,
        },
        $setOnInsert: {
          userId,
          appliedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
    return ref;
  }

  async getListReferralInfoByRefCode(
    refCode: string,
    params: BaseQueryParams,
  ): Promise<
    BaseResultPagination<{
      userId: string;
      point: number;
      lastTime: Date;
      createdAt: Date;
    }>
  > {
    const sort: any = {};
    sort[params.orderBy || 'point'] = params.desc === 'asc' ? 1 : -1;
    const refs: {
      point: number;
      user: string;
      lastTime: Date;
      createdAt: Date;
    }[] = await this.db.referralInfoModel.aggregate([
      {
        $match: {
          referredBy: refCode,
        },
      },
      {
        $lookup: {
          from: 'point_histories',
          localField: 'userId',
          foreignField: 'ref',
          as: 'point_histories',
          pipeline: [
            {
              $sort: {
                createdAt: -1,
              },
            },
          ],
        },
      },
      {
        $project: {
          point: {
            $sum: '$point_histories.point',
          },
          user: '$userId',
          lastTime: {
            $first: '$point_histories.createdAt',
          },
          createdAt: '$createdAt',
        },
      },
      {
        $sort: sort,
      },
      {
        $skip: params.skipIndex,
      },
      {
        $limit: params.size,
      },
    ]);

    const rs = new BaseResultPagination<{
      userId: string;
      point: number;
      lastTime: Date;
      createdAt: Date;
    }>();
    rs.data = new PaginationDto<{
      userId: string;
      point: number;
      lastTime: Date;
      createdAt: Date;
    }>(
      refs.map((r) => ({
        userId: r.user,
        point: r.point,
        lastTime: r.lastTime,
        createdAt: r.createdAt,
      })),
      refs.length,
      params.page,
      params.size,
    );

    return rs;
  }
}
