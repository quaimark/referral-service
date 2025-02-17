export * from './types';
export * from './models';
import { Season } from './models';
import * as services from './services';
export type ReferralModuleExport = {
    db: services.DatabaseService;
    seasonService: services.SeasonService;
    referralService: services.ReferralService;
    pointService: services.PointService;
};
export declare const createServices: (dbConnection: string, defaultSeason: Season, dbName?: string) => Promise<ReferralModuleExport>;
