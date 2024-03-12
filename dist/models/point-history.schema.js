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
    chain: String,
    user: String,
    ref: String,
    season: { type: mongoose_1.Schema.Types.ObjectId, ref: types_1.CollectionName.Season },
}, {
    timestamps: true,
    autoIndex: true,
});
exports.PointHistorySchema.index({ user: 1 });
exports.PointHistorySchema.index({ ref: 1 });
exports.PointHistorySchema.index({ blockTime: 1 });
exports.PointHistorySchema.index({ 'source.type': 1 });
//# sourceMappingURL=point-history.schema.js.map