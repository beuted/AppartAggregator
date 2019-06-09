import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';
import { IAggregator } from './IAggregator';
import * as storage from 'node-persist';

export class AppartCache {
    private _refreshPeriod = 10000;
    private _apparts: IAppart[] = [];
    private _listAggregators: IAggregator[];
    private _listFilters: IFilter[];

    constructor(listAggregators: IAggregator[], listFilters: IFilter[]) {
        this._listAggregators = listAggregators;
        this._listFilters = listFilters;
    }

    public async Start() {
        this._apparts = await storage.getItem('apparts') || [];
        await this.RefreshCache();
    }

    public GetApparts() {
        this.ApplyFilters();

        return this._apparts;
    }

    private async RefreshCache() {
        let apparts: IAppart[] = [];
        let getAppartPromises: Promise<IAppart[]>[] = [];
        //TODO: pas besoin de chopper les apparts qu'on connait deja et ceux qu'on a blacklistés.
        for (let i = 0; i < this._listAggregators.length; i++) {
            getAppartPromises.push(this._listAggregators[i].GetAppartments());
        }

        // Hit all aggregator in parrallel
        var promiseResponses = await Promise.all(getAppartPromises);

        for (let i = 0; i < this._listAggregators.length; i++) {
            apparts = apparts.concat(promiseResponses[i]);
        }

        this.ApplyFilters();

        if (JSON.stringify(apparts) != JSON.stringify(this._apparts))
            storage.setItem('apparts', apparts);

        this._apparts = apparts;

        setTimeout(() => this.RefreshCache(), this._refreshPeriod);
    }

    private ApplyFilters() {
        for (let i = 0; i < this._listFilters.length; i++) {
            this._apparts = this._listFilters[i].Filter(this._apparts);
        }
    }
}