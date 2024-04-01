"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointService = void 0;
const types_1 = require("../types");
class PointService {
    constructor(db, seasonService) {
        this.db = db;
        this.seasonService = seasonService;
    }
    async getUserPoint(userId, seasonNumber) {
        var _a;
        const season = seasonNumber
            ? await this.db.seasonModel.findOne({ seasonNumber })
            : await this.seasonService.getOrCreateCurrentSeason();
        const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
        const to = season.endAt ? new Date(season.endAt) : null;
        const match = {
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
        return ((_a = point[0]) === null || _a === void 0 ? void 0 : _a.point) || 0;
    }
    async getUserRanking(userId, seasonNumber) {
        const season = seasonNumber
            ? await this.db.seasonModel.findOne({ seasonNumber })
            : await this.seasonService.getOrCreateCurrentSeason();
        const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
        const to = season.endAt ? new Date(season.endAt) : null;
        const match = {
            blockTime: { $gte: from.getTime() },
        };
        if (to) {
            match.blockTime.$lte = to.getTime();
        }
        const total = await this.db.pointHistoryModel.countDocuments(Object.assign({ user: userId }, match));
        if (!total)
            return {
                ranking: -1,
            };
        const topPoints = await this.db.pointHistoryModel.aggregate([
            {
                $match: match,
            },
            { $unwind: '$source' },
            {
                $group: {
                    _id: '$user',
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
                $set: {
                    seasonPoint: {
                        $sum: ['$tradePoint', '$refPoint'],
                    },
                },
            },
            {
                $setWindowFields: {
                    partitionBy: null,
                    sortBy: { seasonPoint: -1 },
                    output: { ranking: { $rank: {} } },
                },
            },
            { $match: { _id: userId } },
            { $project: { ranking: 1, seasonPoint: 1, tradePoint: 1, refPoint: 1 } },
        ]);
        topPoints.length > 0 && delete topPoints[0]._id;
        return topPoints.length > 0 ? topPoints[0] : { ranking: -1 };
    }
    async userPointHistory(userId, query) {
        const result = new types_1.BaseResultPagination();
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
        result.data = new types_1.PaginationDto(data, total, page, size);
        return result;
    }
    async getTopPoints(param) {
        const season = param.seasonNumber
            ? await this.db.seasonModel.findOne({ seasonNumber: param.seasonNumber })
            : await this.seasonService.getOrCreateCurrentSeason();
        const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
        const to = season.endAt ? new Date(season.endAt) : null;
        const match = {
            blockTime: { $gte: from.getTime() },
        };
        if (to) {
            match.blockTime.$lte = to.getTime();
        }
        const topPoints = await this.db.pointHistoryModel.aggregate([
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
        const result = new types_1.BaseResultPagination();
        result.data = new types_1.PaginationDto(topPoints.map((t) => ({
            user: t._id.toString(),
            seasonPoint: t.seasonPoint,
            referralPoint: t.refPoint,
            tradingPoint: t.tradePoint,
        })), topPoints.length, param.page, param.size);
        return result;
    }
    async pointCalculate(h, passSeason) {
        var _a;
        const fee = h.fee;
        const isMemberShip = h.addPointForMembership;
        const pointHistory = {
            user: h.to,
            volume: h.price,
            txHash: h.txHash,
            block: h.block,
            chain: h.chain,
            fee,
            point: 0,
            blockTime: h.blockTime.getTime(),
        };
        const season = passSeason ||
            (await this.seasonService.getSeasonByTime(new Date(pointHistory.blockTime)));
        pointHistory.season = ((_a = season === null || season === void 0 ? void 0 : season._id) === null || _a === void 0 ? void 0 : _a.toString()) || null;
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
        if (h.addPointForReferral &&
            (userInfo === null || userInfo === void 0 ? void 0 : userInfo.referredBy) &&
            season.refTradePointRatio &&
            season.refTradePointRatio > 0) {
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
        const refSource = [];
        if (h.addPointForSponsor &&
            season.sponsorTradePointRatio &&
            season.sponsorTradePointRatio > 0) {
            const refUser = (userInfo === null || userInfo === void 0 ? void 0 : userInfo.referredBy)
                ? await this.db.referralInfoModel.findOne({
                    referralCode: userInfo.referredBy,
                })
                : undefined;
            if (!refUser)
                return;
            const refPoint = tradeVolumePoint * season.sponsorTradePointRatio;
            refSource.push({
                type: 'referral',
                point: refPoint,
            });
            const refPointHistory = {
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
            const sellerPointHistory = {
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
                const data = d.updateOne.update;
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
    async topByRefCode(param) {
        const result = new types_1.BaseResultPagination();
        const { page, skipIndex, size } = param;
        const data = await this.db.referralInfoModel.aggregate([
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
        result.data = new types_1.PaginationDto(data.map((t) => ({
            user: t.user,
            count: t.count,
            refCode: t._id,
        })), total, page, size);
        return result;
    }
    async userRefStats(userId, rankBy = 'allRef', time = new Date()) {
        var _a, _b, _c, _d, _e;
        const total = await this.db.pointHistoryModel.countDocuments({
            user: userId,
            ref: { $ne: null },
        });
        const refInfo = await this.db.referralInfoModel.findOne({ userId });
        const allRef = await this.db.referralInfoModel.countDocuments({
            referredBy: refInfo.referralCode,
            updatedAt: { $lte: time },
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
        const ranking = await this.db.referralInfoModel.aggregate([
            {
                $match: {
                    referredBy: { $ne: null },
                    updatedAt: { $lte: time },
                },
            },
            {
                $group: {
                    _id: '$referredBy',
                    allRef: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'referral_infos',
                    localField: '_id',
                    foreignField: 'referralCode',
                    as: 'user',
                },
            },
            {
                $set: {
                    userId: { $arrayElemAt: ['$user.userId', 0] },
                },
            },
            {
                $lookup: {
                    from: 'point_histories',
                    let: { userId: '$userId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$$userId', '$user'] },
                                        {
                                            $lte: ['$blockTime', time.getTime()],
                                        },
                                    ],
                                },
                            },
                        },
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
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $group: {
                                _id: '$_id.user',
                                total: { $sum: '$total' },
                                countRef: { $sum: 1 },
                                count: { $sum: '$count' },
                            },
                        },
                    ],
                    as: 'point',
                },
            },
            {
                $set: {
                    total: { $arrayElemAt: ['$point.total', 0] },
                    count: { $arrayElemAt: ['$point.count', 0] },
                    countRef: { $arrayElemAt: ['$point.countRef', 0] },
                },
            },
            {
                $setWindowFields: {
                    partitionBy: null,
                    sortBy: { [rankBy]: -1 },
                    output: { ranking: { $rank: {} } },
                },
            },
            {
                $match: {
                    userId: userId,
                },
            },
        ]);
        return {
            id: userId,
            total: ((_a = ranking[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            ranking: ((_b = ranking[0]) === null || _b === void 0 ? void 0 : _b.ranking) || -1,
            count: ((_c = ranking[0]) === null || _c === void 0 ? void 0 : _c.count) || 0,
            countRef: ((_d = ranking[0]) === null || _d === void 0 ? void 0 : _d.countRef) || 0,
            allRef: ((_e = ranking[0]) === null || _e === void 0 ? void 0 : _e.allRef) || 0,
        };
    }
}
exports.PointService = PointService;
//# sourceMappingURL=point.service.js.map