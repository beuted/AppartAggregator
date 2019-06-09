import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';
import { IAggregator } from './IAggregator';
import { IConfig } from '../models/IConfig';

export class AppartCache {
    private _refreshPeriod = 10000;
    private _apparts: IAppart[] = [];
    private _listAggregators: IAggregator[];
    private _listFilters: IFilter[];

    constructor(listAggregators: IAggregator[], listFilters: IFilter[]) {
        this._listAggregators = listAggregators;
        this._listFilters = listFilters;

        this.refreshCache(null);
    }

    public GetApparts() {
        this.ApplyFilters();

        return this._apparts;
    }

    private async refreshCache(config: IConfig) {
        console.log("Refresh cache");
        let apparts: IAppart[] = [];
        let getAppartPromises: Promise<IAppart[]>[] = [];
        for (let i = 0; i < this._listAggregators.length; i++) {
            getAppartPromises.push(this._listAggregators[i].GetAppartments(config));
        }

        // Hit all aggregator in parrallel
        var promiseResponses = await Promise.all(getAppartPromises);

        for (let i = 0; i < this._listAggregators.length; i++) {
            apparts = apparts.concat(promiseResponses[i]);
        }

        this._apparts = apparts;

        this.ApplyFilters();

        setTimeout(() => this.refreshCache(null), this._refreshPeriod);
    }

    private ApplyFilters() {
        for (let i = 0; i < this._listFilters.length; i++) {
            this._apparts = this._listFilters[i].Filter(this._apparts);
        }
    }
}