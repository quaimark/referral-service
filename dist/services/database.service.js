"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const types_1 = require("../types");
class DatabaseService {
    constructor(connectionString) {
        this.connectionString = connectionString;
        this.connection = mongoose_1.default.createConnection(this.connectionString, {});
        this.pointHistoryModel = this.connection.model(types_1.CollectionName.PointHistory, models_1.PointHistorySchema);
        this.seasonModel = this.connection.model(types_1.CollectionName.Season, models_1.SeasonSchema);
        this.referralInfoModel = this.connection.model(types_1.CollectionName.ReferralInfo, models_1.ReferralInfoSchema);
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.service.js.map