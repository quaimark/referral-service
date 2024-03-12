export * from './types';
export * from './models';
import * as services from './services';
declare const createServices: (dbConnection: string, dbName?: string) => {
    db: services.DatabaseService;
    seasonService: services.SeasonService;
    referralService: services.ReferralService;
    pointService: services.PointService;
};
export default createServices;
