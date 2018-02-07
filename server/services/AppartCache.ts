import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';
import { IAggregator } from './IAggregator';

export class AppartCache {
    private apparts: IAppart[] = [];
    private listAggregators: IAggregator[];
    private listFilters: IFilter[];

    constructor(listAggregators: IAggregator[], listFilters: IFilter[]) {
        this.listAggregators = listAggregators;
        this.listFilters = listFilters;

        this.refeshCache();
        // Refresh the cache every 30 secs
        setInterval(this.refeshCache, 30000);
    }

    public GetApparts() {
        return this.apparts;
    }

    private async refeshCache() {
        let apparts: IAppart[] = [];
        for (let i = 0; i < this.listAggregators.length; i++) {
            let newApparts = await this.listAggregators[i].GetAppartments();
            apparts = apparts.concat(newApparts);
        }

        for (let i = 0; i < this.listFilters.length; i++) {
            apparts = this.listFilters[i].Filter(apparts);
        }
        
        this.apparts = apparts;
    }
}