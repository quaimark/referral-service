export declare enum CollectionName {
    ReferralInfo = "referral_info",
    PointHistory = "point_history",
    Season = "season"
}
export declare class BaseQueryParams {
    _search: string;
    set search(search: string);
    get search(): string;
    page: number;
    _size: number;
    set size(size: number);
    get size(): number;
    orderBy: string;
    desc?: string;
    get skipIndex(): number;
    get sort(): [string, any][];
}
export declare class PaginationDto<T> {
    total: number;
    currentPage: number;
    size: number;
    pages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    items: T[];
    constructor();
    constructor(total: number, page: number, size: number);
    constructor(items: T[], total: number, page: number, size: number);
}
export declare class BaseResultPagination<T> {
    errors: Record<string, string[]>;
    data: PaginationDto<T>;
    success: boolean;
}
export declare class TopPointDto {
    user: string;
    seasonPoint: number;
    tradingPoint: number;
    referralPoint: number;
    collectionBonus: number;
}
export declare class GetTopPointParams extends BaseQueryParams {
    seasonNumber?: number;
    chainId?: string;
}
export declare class GetUserPointHistoriesDto extends BaseQueryParams {
    chainId?: string;
}
export declare class GetTopRefDto extends BaseQueryParams {
    chainId: string;
}
export declare class TopByRefDto {
    user: string;
    refCode: string;
    count: number;
    total: number;
}
