import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';
import * as storage from 'node-persist';

export class AppartKeywordsFilter implements IFilter {
    private _descExcludedKeywords: string[];

    constructor(descExcludedKeywords: string[]) {
        this._descExcludedKeywords = descExcludedKeywords || []; // lower case
    }

    public async InitFromStorage() {
        this._descExcludedKeywords = await storage.getItem('excludedKeywords') || [];
    }

    // TODO: Set method

    public Filter(apparts: IAppart[]): IAppart[] {
        var filteredApparts : IAppart[] = [];

        for (var i = 0; i < apparts.length; i++) {
            if (this.IsAppartValid(apparts[i])) {
                filteredApparts.push(apparts[i]);
            }
        }

        return filteredApparts;
    }


    private IsAppartValid(appart: IAppart) {
        for (var i = 0; i < this._descExcludedKeywords.length; i++) {
            if (appart.description && appart.description.toLowerCase().includes(this._descExcludedKeywords[i])) {
                return false;
            }
        }
        return true;
    }
}
