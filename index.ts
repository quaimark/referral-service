export * from './types';
export * from './models';
import { globalState } from './globalState';
import { Season } from './models';
import * as services from './services';

export type ReferralModuleExport = {
  db: services.DatabaseService;
  seasonService: services.SeasonService;
  referralService: services.ReferralService;
  pointService: services.PointService;
};

export const createServices = (
  dbConnection: string,
  defaultSeason: Season,
  dbName?: string,
): ReferralModuleExport => {
  globalState.defaultSeason = defaultSeason;
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
