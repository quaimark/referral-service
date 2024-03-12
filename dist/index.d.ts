export * from './types';
export * from './models';
import * as services from './services';
declare const createServices: (dbConnection: string) => {
    db: services.DatabaseService;
    seasonService: services.SeasonService;
    referralService: services.ReferralService;
};
export default createServices;
