import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';
import * as storage from 'node-persist';
import * as moment from 'moment';

export class AppartKeywordsFilter implements IFilter {
    private _descExcludedKeywords: string[];

    constructor(descExcludedKeywords: string[]) {
        this._descExcludedKeywords = descExcludedKeywords || []; // lower case
    }

    public async InitFromStorage() {
        this._descExcludedKeywords = await storage.getItem('excludedKeywords') || [];
    }

    public Set(id: string, value: boolean) {
        var idPosInArray = this._descExcludedKeywords.indexOf(id);
        if (idPosInArray == -1 && !!value) {
            console.log(`${moment().format()}: Excluding appart keyword: ${id}`);
            this._descExcludedKeywords.push(id);
        } else if (idPosInArray != -1 && !value) {
            console.log(`${moment().format()}: Stop excluding appart keyword: ${id}`);
            this._descExcludedKeywords.splice(idPosInArray, 1);
        }

        storage.setItem('excludedKeywords', this._descExcludedKeywords);
    }

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
