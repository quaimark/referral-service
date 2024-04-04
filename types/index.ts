import { ObjectId } from 'mongodb';

export enum CollectionName {
  ReferralInfo = 'referral_info',
  PointHistory = 'point_history',
  Season = 'season',
}

export class BaseQueryParams {
  _search: string;

  public set search(search: string) {
    const addressReg = /^[0]+[x]/;
    if (
      (ObjectId.isValid(search) && search.length > 20) ||
      (addressReg.test(search) && search.length > 40)
    ) {
      this._search = search.trim().toLowerCase();
    } else {
      const searchContent = search
        .trim()
        .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ''); //remove all special characters
      this._search = `^${searchContent}.*$`;
    }
  }

  public get search() {
    return this._search;
  }

  page = 1;
  _size = 10;
  public set size(size: number) {
    this._size = size;
  }
  public get size() {
    return this._size < 100 ? this._size : 100;
  }
  orderBy: string;
  desc?: string;
  // skipIndex = this.size * (this.page - 1);
  public get skipIndex() {
    return this.size * (this.page - 1);
  }
  public get sort() {
    const orderBy = this.orderBy ?? 'createdAt';
    const order: [string, any][] = [[orderBy, this.desc === 'asc' ? 1 : -1]];
    if (orderBy !== 'createdAt') {
      order.push(['createdAt', 1]);
    }
    return order;
  }
}

export class PaginationDto<T> {
  public total: number;

  public currentPage: number;

  public size: number;

  public pages: number;

  public hasNext: boolean;

  public hasPrevious: boolean;

  public items: T[];

  public constructor();

  public constructor(total: number, page: number, size: number);

  public constructor(items: T[], total: number, page: number, size: number);

  public constructor(...args: any[]) {
    if (args.length === 3) {
      this.total = Number(args[0]);
      this.currentPage = Number(args[1]);
      this.size = Number(args[2]);
      this.items = [];
      this.pages =
        Number(args[0]) === 0 ? 0 : Math.ceil((1.0 * this.total) / this.size);
    }
    if (args.length === 4) {
      this.total = args[1];
      this.currentPage = args[2];
      this.size = args[3];
      this.items = args[0];
      this.pages =
        Number(args[1]) === 0 ? 0 : Math.ceil((1.0 * this.total) / this.size);
    }
    this.hasNext = this.pages > this.currentPage;
    this.hasPrevious = this.currentPage > 1;
  }
}

export class BaseResultPagination<T> {
  errors: Record<string, string[]>;
  data: PaginationDto<T>;
  success = true;
}

export class TopPointDto {
  user: string;

  seasonPoint: number;

  tradingPoint: number;

  referralPoint: number;
}

export class GetTopPointParams extends BaseQueryParams {
  seasonNumber: number;
}

export class TopByRefDto {
  user: string;
  refCode: string;
  count: number;
  total: number;
}
