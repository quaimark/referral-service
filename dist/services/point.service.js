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
            user: t._id,
            seasonPoint: t.seasonPoint,
            referralPoint: t.refPoint,
            tradingPoint: t.tradePoint,
        })), topPoints.length, param.page, param.size);
        return result;
    }
    async pointCalculate(h, addPointForSeller = false, passSeason) {
        var _a;
        const fee = h.fee;
        const isMemberShip = h.isMembership;
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
        if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.referredBy) &&
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
        const refUser = (userInfo === null || userInfo === void 0 ? void 0 : userInfo.referredBy)
            ? await this.db.referralInfoModel.findOne({
                referralCode: userInfo.referredBy,
            })
            : undefined;
        const refSource = [];
        if (refUser &&
            season.sponsorTradePointRatio &&
            season.sponsorTradePointRatio > 0) {
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
        if (addPointForSeller) {
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
        return await this.db.pointHistoryModel.bulkWrite(bulkWrite);
    }
}
exports.PointService = PointService;
//# sourceMappingURL=point.service.js.map