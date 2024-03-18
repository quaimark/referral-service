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
    constructor(connectionString, dbName) {
        this.connectionString = connectionString;
        this.dbName = dbName;
        const connectWithRetry = async () => {
            try {
                this.connection = await mongoose_1.default
                    .createConnection(this.connectionString, {
                    dbName: this.dbName,
                })
                    .asPromise();
                this.pointHistoryModel = this.connection.model(types_1.CollectionName.PointHistory, models_1.PointHistorySchema);
                this.seasonModel = this.connection.model(types_1.CollectionName.Season, models_1.SeasonSchema);
                this.referralInfoModel = this.connection.model(types_1.CollectionName.ReferralInfo, models_1.ReferralInfoSchema);
            }
            catch (error) {
                console.error('Failed to connect to mongo on startup - retrying in 5 sec', error);
                setTimeout(connectWithRetry, 5000);
            }
        };
        connectWithRetry();
    }
    waitForConnection() {
        return new Promise((resolve) => {
            if (this.connection) {
                resolve(true);
            }
            else {
                setTimeout(() => {
                    this.waitForConnection().then(resolve);
                }, 1000);
            }
        });
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.service.js.map