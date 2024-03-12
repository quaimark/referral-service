export * from './types';
export * from './models';
import * as services from './services';

const createServices = (dbConnection: string) => {
  const db = new services.DatabaseService(dbConnection);
  return {
    db,
    seasonService: new services.SeasonService(db),
    referralService: new services.ReferralService(db),
    pointService: new services.PointService(db),
  };
};

export default createServices;
