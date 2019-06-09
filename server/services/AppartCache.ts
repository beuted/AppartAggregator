import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';
import { IAggregator } from './IAggregator';
import { IConfig } from '../models/IConfig';

export class AppartCache {
    private apparts: IAppart[] = [];
    private listAggregators: IAggregator[];
    private listFilters: IFilter[];

    constructor(listAggregators: IAggregator[], listFilters: IFilter[]) {
        this.listAggregators = listAggregators;
        this.listFilters = listFilters;

        this.refreshCache(null);
        // Refresh the cache every 30 secs
        setInterval(() => this.refreshCache(null), 10000);
    }

    public GetApparts() {
        return this.apparts;
    }

    private async refreshCache(config: IConfig) {
        let apparts: IAppart[] = [];
        let getAppartPromises: Promise<IAppart[]>[] = [];
        for (let i = 0; i < this.listAggregators.length; i++) {
            getAppartPromises.push(this.listAggregators[i].GetAppartments(config));
        }

        // Hit all aggregator in parrallel
        var promiseResponses = await Promise.all(getAppartPromises);

        for (let i = 0; i < this.listAggregators.length; i++) {
            apparts = apparts.concat(promiseResponses[i]);
        }

        for (let i = 0; i < this.listFilters.length; i++) {
            apparts = this.listFilters[i].Filter(apparts);
        }

        this.apparts = apparts;
    }
}