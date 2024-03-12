import { BaseQueryParams, BaseResultPagination, GetTopPointParams, TopPointDto } from '../types';
import { DatabaseService } from './database.service';
import { SeasonService } from './season.service';
import { PointHistoryDocument } from 'models';
export declare class PointService {
    private readonly db;
    constructor(db: DatabaseService);
    seasonService: SeasonService;
    getUserPoint(userId: string, seasonNumber?: number): Promise<number>;
    getUserRanking(userId: string, seasonNumber?: number): Promise<{
        ranking: number;
        seasonPoint?: number;
        tradePoint?: number;
        refPoint?: number;
    }>;
    userPointHistory(userId: string, query: BaseQueryParams): Promise<BaseResultPagination<PointHistoryDocument>>;
    getTopPoints(param: GetTopPointParams): Promise<BaseResultPagination<TopPointDto>>;
}
