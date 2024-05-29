"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointHistorySchema = void 0;
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
exports.PointHistorySchema = new mongoose_1.Schema({
    txHash: String,
    block: Number,
    blockTime: Number,
    point: Number,
    source: [Object],
    fee: Number,
    volume: Number,
    historyId: String,
    chain: String,
    user: String,
    ref: String,
    season: { type: mongoose_1.Schema.Types.ObjectId, ref: types_1.CollectionName.Season },
}, {
    timestamps: true,
    autoIndex: true,
});
exports.PointHistorySchema.index({ historyId: 1 });
exports.PointHistorySchema.index({ ref: 1 });
exports.PointHistorySchema.index({ blockTime: 1 });
exports.PointHistorySchema.index({ 'source.type': 1 });
exports.PointHistorySchema.index({ user: 1, historyId: 1 }, { unique: true });
//# sourceMappingURL=point-history.schema.js.map