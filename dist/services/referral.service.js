"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const types_1 = require("../types");
const node_crypto_1 = __importDefault(require("node:crypto"));
class ReferralService {
    constructor(db) {
        this.db = db;
    }
    async getReferralInfoByUserId(userId) {
        const refInfo = await this.db.referralInfoModel.findOne({ userId }).exec();
        if (refInfo === null || refInfo === void 0 ? void 0 : refInfo.referralCode) {
            return refInfo;
        }
        const hash = node_crypto_1.default.createHash('sha256').update(userId).digest('hex');
        const ref = 'REF-' + hash.substring(0, 8);
        return await this.db.referralInfoModel
            .findOneAndUpdate({ userId }, {
            $set: { referralCode: ref },
            $setOnInsert: { userId, generatedAt: new Date() },
        }, { new: true, upsert: true })
            .exec();
    }
    async getUserByRefCode(refCode) {
        return await this.db.referralInfoModel
            .findOne({ referralCode: refCode })
            .exec();
    }
    async addRefBy(userId, refCode) {
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
        let refTreeUser = refByUser;
        while (!!(refTreeUser === null || refTreeUser === void 0 ? void 0 : refTreeUser.referredBy)) {
            if (refTreeUser.referredBy === user.referralCode) {
                throw new Error('user cannot ref by himself');
            }
            refTreeUser = await this.db.referralInfoModel.findOne({
                referralCode: refTreeUser.referredBy,
            });
        }
        const ref = await this.db.referralInfoModel.findOneAndUpdate({
            userId,
        }, {
            $set: {
                referredBy: refCode,
            },
            $setOnInsert: {
                userId,
                appliedAt: new Date(),
            },
        }, {
            new: true,
            upsert: true,
        });
        return ref;
    }
    async getListReferralInfoByRefCode(refCode, params) {
        const rs = new types_1.BaseResultPagination();
        if (!refCode)
            return rs;
        const sort = {};
        sort[params.orderBy || 'point'] = params.desc === 'asc' ? 1 : -1;
        const refs = await this.db.referralInfoModel.aggregate([
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
        rs.data = new types_1.PaginationDto(refs.map((r) => ({
            userId: r.user,
            point: r.point,
            lastTime: r.lastTime,
            createdAt: r.createdAt,
        })), refs.length, params.page, params.size);
        return rs;
    }
}
exports.ReferralService = ReferralService;
//# sourceMappingURL=referral.service.js.map