"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServices = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./models"), exports);
const globalState_1 = require("globalState");
const services = __importStar(require("./services"));
const createServices = (dbConnection, defaultSeason, dbName) => {
    globalState_1.globalState.defaultSeason = defaultSeason;
    const db = new services.DatabaseService(dbConnection, dbName);
    const seasonService = new services.SeasonService(db);
    const referralService = new services.ReferralService(db);
    const pointService = new services.PointService(db, seasonService);
    return {
        db,
        seasonService,
        referralService,
        pointService,
    };
};
exports.createServices = createServices;
//# sourceMappingURL=index.js.map