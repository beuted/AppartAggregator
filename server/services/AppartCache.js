"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class AppartCache {
    constructor(listAggregators, listFilters) {
        this.apparts = [];
        this.listAggregators = listAggregators;
        this.listFilters = listFilters;
        this.refeshCache();
        // Refresh the cache every 30 secs
        setInterval(this.refeshCache, 30000);
    }
    GetApparts() {
        return this.apparts;
    }
    refeshCache() {
        return __awaiter(this, void 0, void 0, function* () {
            let apparts = [];
            for (let i = 0; i < this.listAggregators.length; i++) {
                let newApparts = yield this.listAggregators[i].GetAppartments();
                apparts = apparts.concat(newApparts);
            }
            for (let i = 0; i < this.listFilters.length; i++) {
                apparts = this.listFilters[i].Filter(apparts);
            }
            this.apparts = apparts;
        });
    }
}
exports.AppartCache = AppartCache;
