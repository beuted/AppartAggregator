import { IAppart } from '../models/IAppart';

export interface IFilter {
    Filter(apparts: IAppart[]): IAppart[]
}