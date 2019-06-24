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
        this._starredAppart = await storage.getItem('starred_apparts') || [];

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
        console.log(`Action: ${value ? 'starred': 'unstarred'} on annonce: ${id}`);
        var foundId = this._starredAppart.findIndex(i => i === id);
        if (value && foundId <= -1) {
            this._starredAppart.push(id);
        }
        if (!value && foundId > -1) {
            this._starredAppart.splice(foundId, 1);
        }

        storage.setItem('starred_apparts', this._starredAppart);
    }

    public SetAppartNotes(id: string, notes: string) {
        console.log(`Action: note modified on annonce: ${id}`);

        var foundId = this._apparts.findIndex(x => x.id === id);
        if (foundId <= -1) {
            console.error(`Cannot add notes to appart id ${id}, it cannot be found in cache.`);
            return;
        }
        this._apparts[foundId].notes = notes;
        storage.setItem('apparts', this._apparts);
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

        var hasBeenModified = false;
        for (let i = 0; i < this._listAggregators.length; i++) {
            // Only push the one you don't know yet based on the Id
            for (let j = 0; j < promiseResponses[i].length; j++) {
                var appart = promiseResponses[i][j];
                if (this._apparts.findIndex(x => x.id == appart.id) === -1) {
                    this._apparts.push(appart);
                    hasBeenModified = true;
                }
            }
        }

        // Avoid race condition and reset the appart when all processing have been done (both in aggregators and here)
        if (this._resetApparts) {
            this._resetApparts = false;
            this._apparts = [];
            for (let i = 0; i < this._listAggregators.length; i++) {
                this._listAggregators[i].ResetCache();
            }
            hasBeenModified = true;
        }

        // Do not write on filesystem when not necessary
        if (hasBeenModified) {
            storage.setItem('apparts', this._apparts);
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