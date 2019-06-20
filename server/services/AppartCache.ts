import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';
import { IAggregator } from './IAggregator';
import * as storage from 'node-persist';

// Poorly named class, Each Aggregator has its own cache
export class AppartCache {
    private _refreshPeriod = 30000;
    private _apparts: IAppart[] = [];
    private _listAggregators: IAggregator[];
    private _listFilters: IFilter[];
    private _resetApparts: boolean = false;
    private _starredAppart: string[] = [];

    constructor(listAggregators: IAggregator[], listFilters: IFilter[]) {
        this._listAggregators = listAggregators;
        this._listFilters = listFilters;
    }

    public async Start() {
        this._apparts = await storage.getItem('apparts') || [];

        for (let i = 0; i < this._listAggregators.length; i++) {
            this._listAggregators[i].Start();
        }

        this.RefreshCacheLoop();
    }

    public GetAppartsFiltered() {
        return this.ApplyFilters(this._apparts);
    }

    public DeleteApparts() {
        this._resetApparts = true;
    }

    public SetStarredAppart(id: string, value: boolean) {
        console.log("Star", id, value);
        var foundId = this._starredAppart.findIndex(i => i === id);
        if (value && foundId <= -1) {
            this._starredAppart.push(id);
        }
        if (!value && foundId > -1) {
            this._starredAppart.splice(foundId, 1);
        }

        console.log(this._starredAppart)
    }

    public SetAppartNote(id: string, notes: string) {
        var foundId = this._starredAppart.findIndex(i => i === id);
        if (foundId <= -1) {
            console.error(`Cannot add notes to appart id ${id}, it cannot be found in cache.`);
            return;
        }
        //TODO: ca va pas marcher parce que note doit etre dan sle cache de chaque appart
        this._apparts[foundId].notes = notes;
    }

    public GetStarredApparts() {
        return this._starredAppart;
    }

    private async RefreshCacheLoop() {
        let getAppartPromises: Promise<IAppart[]>[] = [];
        for (let i = 0; i < this._listAggregators.length; i++) {
            getAppartPromises.push(this._listAggregators[i].GetAppartments());
        }

        // Hit all aggregator in parrallel
        var promiseResponses = await Promise.all(getAppartPromises);

        var apparts: IAppart[] = [];
        for (let i = 0; i < this._listAggregators.length; i++) {
            // Only push the one you don't know yet based on the Id
            apparts = apparts.concat(promiseResponses[i]);
        }

        // Avoid race condition and reset the appart when all processing have been done
        if (this._resetApparts) {
            this._resetApparts = false;
            apparts = [];
            for (let i = 0; i < this._listAggregators.length; i++) {
                this._listAggregators[i].ResetCache();
            }
        }

        // Do not write on filesystem when not necessary
        if (JSON.stringify(this._apparts) !== JSON.stringify(apparts)) {
            storage.setItem('apparts', apparts);
            this._apparts = apparts;
        }

        setTimeout(() => this.RefreshCacheLoop(), this._refreshPeriod);
    }

    private ApplyFilters(apparts: IAppart[]) {
        let appartsFiltered: IAppart[] = apparts.slice(); // copy array
        for (let i = 0; i < this._listFilters.length; i++) {
            appartsFiltered = this._listFilters[i].Filter(appartsFiltered);
        }
        return appartsFiltered
    }
}