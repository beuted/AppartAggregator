import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';
import { IAggregator } from './IAggregator';
import * as storage from 'node-persist';

export class AppartCache {
    private _refreshPeriod = 30000;
    private _apparts: IAppart[] = [];
    private _listAggregators: IAggregator[];
    private _listFilters: IFilter[];
    private resetApparts: boolean = false;;

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

    public DeleteApparts() {
        this.resetApparts = true;
    }

    private async RefreshCache() {
        let getAppartPromises: Promise<IAppart[]>[] = [];
        //TODO: pas besoin de chopper les apparts qu'on connait deja et ceux qu'on a blacklistés.
        for (let i = 0; i < this._listAggregators.length; i++) {
            getAppartPromises.push(this._listAggregators[i].GetAppartments());
        }

        // Hit all aggregator in parrallel
        var promiseResponses = await Promise.all(getAppartPromises);

        for (let i = 0; i < this._listAggregators.length; i++) {
            // Only push the one you don't know yet based on the Id
            this._apparts = this._apparts.concat(promiseResponses[i].filter(x => this._apparts.findIndex(appart => appart.id == x.id) == -1));
        }

        this.ApplyFilters();

        // Avoid race condition and reset the appart when all processing have been done
        if (this.resetApparts) {
            this.resetApparts = false;
            this._apparts = [];
        }

        storage.setItem('apparts', this._apparts);

        setTimeout(() => this.RefreshCache(), this._refreshPeriod);
    }

    private ApplyFilters() {
        for (let i = 0; i < this._listFilters.length; i++) {
            this._apparts = this._listFilters[i].Filter(this._apparts);
        }
    }
}