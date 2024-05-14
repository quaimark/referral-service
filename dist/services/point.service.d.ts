import { PointHistoryDocument, Season } from 'models';
import { BaseResultPagination, GetTopPointParams, GetTopRefDto, GetUserPointHistoriesDto, TopByRefDto, TopPointDto } from '../types';
import { DatabaseService } from './database.service';
import { SeasonService } from './season.service';
export declare class PointService {
    private readonly db;
    private readonly seasonService;
    constructor(db: DatabaseService, seasonService: SeasonService);
    getUserPoint({ userId, chainId, seasonNumber, }: {
        userId: string;
        seasonNumber?: number;
        chainId?: string;
    }): Promise<number>;
    getUserRanking({ userId, chainId, seasonNumber, }: {
        userId: string;
        seasonNumber?: number;
        chainId?: string;
    }): Promise<{
        ranking: number;
        seasonPoint?: number;
        tradePoint?: number;
        refPoint?: number;
    }>;
    userPointHistory(userId: string, query: GetUserPointHistoriesDto): Promise<BaseResultPagination<PointHistoryDocument>>;
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
        addPointForMembership?: boolean;
        addPointForSponsor?: boolean;
        addPointForReferral?: boolean;
        addPointForSeller?: boolean;
        plusPercent?: number;
        historyId?: string;
    }, passSeason?: Season): Promise<import("mongodb").BulkWriteResult>;
    topByRefCode(param: GetTopRefDto): Promise<BaseResultPagination<TopByRefDto>>;
    userRefStats(userId: string, rankBy?: 'countRef' | 'total' | 'count' | 'allRef', time?: Date, chainId?: string): Promise<{
        id: string;
        total: number;
        ranking: number;
        count: number;
        countRef: number;
        allRef: number;
    }>;
}
