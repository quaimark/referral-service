"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.SeasonSchema = new mongoose_1.default.Schema({
    seasonNumber: Number,
    name: String,
    startAt: Date,
    endAt: Date,
    pointTradeVolumeRatio: Number,
    membershipPlusVolumeRatio: Number,
    refTradePointRatio: Number,
    membershipShareFeeRatio: Number,
});
//# sourceMappingURL=season.schema.js.map