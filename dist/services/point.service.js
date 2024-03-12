"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointService = void 0;
const types_1 = require("../types");
const season_service_1 = require("./season.service");
class PointService {
    constructor(db) {
        this.db = db;
        this.seasonService = new season_service_1.SeasonService(db);
    }
    async getUserPoint(userId, seasonNumber) {
        var _a;
        const season = seasonNumber
            ? await this.db.seasonModel.findOne({ seasonNumber })
            : await this.seasonService.getOrCreateCurrentSeason();
        const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
        const to = season.endAt ? new Date(season.endAt) : null;
        const match = {
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
        return ((_a = point[0]) === null || _a === void 0 ? void 0 : _a.point) || 0;
    }
    async getUserRanking(userId, seasonNumber) {
        const season = seasonNumber
            ? await this.db.seasonModel.findOne({ seasonNumber })
            : await this.seasonService.getOrCreateCurrentSeason();
        const from = new Date(season.seasonNumber === 1 ? 0 : season.startAt);
        const to = season.endAt ? new Date(season.endAt) : null;
        const match = {
            blockTime: { $gte: parseInt(String(from.getTime() / 1000)) },
        };
        if (to) {
            match.blockTime.$lte = parseInt(String(to.getTime() / 1000));
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
            blockTime: { $gte: parseInt(String(from.getTime() / 1000)) },
        };
        if (to) {
            match.blockTime.$lte = parseInt(String(to.getTime() / 1000));
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
}
exports.PointService = PointService;
//# sourceMappingURL=point.service.js.map