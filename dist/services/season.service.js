"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonService = void 0;
class SeasonService {
    constructor(db) {
        this.db = db;
    }
    async getSeasonByTime(time) {
        return await this.db.seasonModel.findOne({
            startAt: { $lte: time },
            $or: [{ endAt: null }, { endAt: { $gte: time } }],
        });
    }
    async getFirstSeason() {
        return await this.db.seasonModel.findOne().sort({ startAt: 1 }).exec();
    }
    async getOrCreateCurrentSeason() {
        let season = await this.db.seasonModel.findOne({ endAt: null }).exec();
        if (!season) {
            const latestSeason = await this.db.seasonModel
                .findOne()
                .sort({ startAt: -1 })
                .exec();
            season = await this.db.seasonModel.create({
                seasonNumber: latestSeason ? latestSeason.seasonNumber + 1 : 1,
                startAt: (latestSeason === null || latestSeason === void 0 ? void 0 : latestSeason.endAt) || new Date(),
                pointTradeVolumeRatio: 10,
                membershipPlusVolumeRatio: 0.1,
                refTradePointRatio: 0.1,
                membershipShareFeeRatio: 0.05,
            });
        }
        return season;
    }
}
exports.SeasonService = SeasonService;
//# sourceMappingURL=season.service.js.map