"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTopPointParams = exports.TopPointDto = exports.BaseResultPagination = exports.PaginationDto = exports.BaseQueryParams = exports.CollectionName = void 0;
const mongodb_1 = require("mongodb");
var CollectionName;
(function (CollectionName) {
    CollectionName["ReferralInfo"] = "referral_info";
    CollectionName["PointHistory"] = "point_history";
    CollectionName["Season"] = "season";
})(CollectionName || (exports.CollectionName = CollectionName = {}));
class BaseQueryParams {
    constructor() {
        this.page = 1;
        this._size = 10;
    }
    set search(search) {
        const addressReg = /^[0]+[x]/;
        if ((mongodb_1.ObjectId.isValid(search) && search.length > 20) ||
            (addressReg.test(search) && search.length > 40)) {
            this._search = search.trim().toLowerCase();
        }
        else {
            const searchContent = search
                .trim()
                .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            this._search = `^${searchContent}.*$`;
        }
    }
    get search() {
        return this._search;
    }
    set size(size) {
        this._size = size;
    }
    get size() {
        return this._size < 100 ? this._size : 100;
    }
    get skipIndex() {
        return this.size * (this.page - 1);
    }
    get sort() {
        var _a;
        const orderBy = (_a = this.orderBy) !== null && _a !== void 0 ? _a : 'createdAt';
        const order = [[orderBy, this.desc === 'asc' ? 1 : -1]];
        if (orderBy !== 'createdAt') {
            order.push(['createdAt', 1]);
        }
        return order;
    }
}
exports.BaseQueryParams = BaseQueryParams;
class PaginationDto {
    constructor(...args) {
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
exports.PaginationDto = PaginationDto;
class BaseResultPagination {
    constructor() {
        this.success = true;
    }
}
exports.BaseResultPagination = BaseResultPagination;
class TopPointDto {
}
exports.TopPointDto = TopPointDto;
class GetTopPointParams extends BaseQueryParams {
}
exports.GetTopPointParams = GetTopPointParams;
//# sourceMappingURL=index.js.map