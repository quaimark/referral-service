export * from './types';
export * from './models';
import * as services from './services';

export type ReferralModuleExport = {
  db: services.DatabaseService;
  seasonService: services.SeasonService;
  referralService: services.ReferralService;
  pointService: services.PointService;
};

export const createServices = (
  dbConnection: string,
  dbName?: string,
): ReferralModuleExport => {
  const db = new services.DatabaseService(dbConnection, dbName);
  return {
    db,
    seasonService: new services.SeasonService(db),
    referralService: new services.ReferralService(db),
    pointService: new services.PointService(db),
  };
};
