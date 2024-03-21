import { PointHistoryDocument, Season } from 'models';
import { BaseQueryParams, BaseResultPagination, GetTopPointParams, TopByRefDto, TopPointDto } from '../types';
import { DatabaseService } from './database.service';
import { SeasonService } from './season.service';
export declare class PointService {
    private readonly db;
    private readonly seasonService;
    constructor(db: DatabaseService, seasonService: SeasonService);
    getUserPoint(userId: string, seasonNumber?: number): Promise<number>;
    getUserRanking(userId: string, seasonNumber?: number): Promise<{
        ranking: number;
        seasonPoint?: number;
        tradePoint?: number;
        refPoint?: number;
    }>;
    userPointHistory(userId: string, query: BaseQueryParams): Promise<BaseResultPagination<PointHistoryDocument>>;
    getTopPoints(param: GetTopPointParams): Promise<BaseResultPagination<TopPointDto>>;
    pointCalculate(h: {
        to: string;
        from: string;
        price: number;
        txHash: string;
        block: number;
        blockTime: Date;
        chain: string;
        fee: number;
        isMembership: boolean;
        plusPercent?: number;
    }, addPointForSeller?: boolean, passSeason?: Season): Promise<import("mongodb").BulkWriteResult>;
    topByRefCode(param: BaseQueryParams): Promise<BaseResultPagination<TopByRefDto>>;
    userRefStats(userId: string): Promise<{
        id: string;
        total: number;
        ranking: number;
        count: number;
        countRef: number;
    }>;
}
