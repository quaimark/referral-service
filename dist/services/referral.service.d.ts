import { BaseQueryParams, BaseResultPagination } from '../types';
import { ReferralInfoDocument } from '../models';
import { DatabaseService } from './database.service';
export declare class ReferralService {
    private readonly db;
    constructor(db: DatabaseService);
    getReferralInfoByUserId(userId: string): Promise<ReferralInfoDocument>;
    getUserByRefCode(refCode: string): Promise<ReferralInfoDocument | null>;
    addRefBy(userId: string, refCode: string): Promise<ReferralInfoDocument>;
    getListReferralInfoByRefCode(refCode: string, params: BaseQueryParams): Promise<BaseResultPagination<{
        userId: string;
        point: number;
    }>>;
}
