import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';

export class AppartFilter implements IFilter {
    private DescExcludedKeywords: string[];

    constructor(descExcludedKeywords: string[]) {
        this.DescExcludedKeywords = descExcludedKeywords || []; // lower case
    }

    Filter(apparts: IAppart[]): IAppart[] {
        var filteredApparts : IAppart[] = [];

        for (var i = 0; i < apparts.length; i++) {
            if (this.IsAppartValid(apparts[i])) {
                filteredApparts.push(apparts[i]);
            }
        }

        return filteredApparts;
    }


    IsAppartValid(appart: IAppart) {
        for (var i = 0; i < this.DescExcludedKeywords.length; i++) {
            if (appart.description && appart.description.toLowerCase().includes(this.DescExcludedKeywords[i])) {
                return false;
            }
        }
        return true;
    }
}
