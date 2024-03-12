"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralInfoSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.ReferralInfoSchema = new mongoose_1.default.Schema({
    userId: String,
    referralCode: String,
    referredBy: String,
    generatedAt: Date,
    appliedAt: Date,
}, {
    timestamps: true,
    autoIndex: true,
});
exports.ReferralInfoSchema.index({ userId: 1 }, { unique: true });
exports.ReferralInfoSchema.index({ referralCode: 1 }, { unique: true });
exports.ReferralInfoSchema.index({ referredBy: 1 });
//# sourceMappingURL=referral.schema.js.map