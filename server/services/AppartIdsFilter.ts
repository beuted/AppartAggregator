import { IAppart } from '../models/IAppart';
import { IFilter } from './IFilter';

export class AppartIdsFilter implements IFilter {
    private _descExcludedIds: string[];

    constructor(descExcludedIds: string[]) {
        this._descExcludedIds = descExcludedIds || [];
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

    public Set(id: string, value: boolean) {
        var idPosInArray = this._descExcludedIds.indexOf(id);
        if (idPosInArray == -1 && !!value) {
            console.log(`Excluding appart id: ${id}`);
            this._descExcludedIds.push(id);
        } else if (idPosInArray != -1 && !value) {
            console.log(`Stop excluding appart id: ${id}`);
            this._descExcludedIds.splice(idPosInArray, 1);
        }
    }

    private IsAppartValid(appart: IAppart) {
        return !(<any>this._descExcludedIds).includes(appart.id);
    }
}
