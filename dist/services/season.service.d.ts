import { SeasonDocument } from '../models';
import { DatabaseService } from './database.service';
export declare class SeasonService {
    private readonly db;
    constructor(db: DatabaseService);
    getSeasonByTime(time: Date): Promise<SeasonDocument | null>;
    getFirstSeason(): Promise<SeasonDocument | null>;
    getOrCreateCurrentSeason(): Promise<SeasonDocument>;
}
