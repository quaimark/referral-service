"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonService = void 0;
const globalState_1 = require("../globalState");
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
            season = await this.db.seasonModel.create(Object.assign(Object.assign({}, globalState_1.globalState.defaultSeason), { seasonNumber: latestSeason ? latestSeason.seasonNumber + 1 : 1, startAt: (latestSeason === null || latestSeason === void 0 ? void 0 : latestSeason.endAt) || new Date() }));
        }
        return season;
    }
}
exports.SeasonService = SeasonService;
//# sourceMappingURL=season.service.js.map