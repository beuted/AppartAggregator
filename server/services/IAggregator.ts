import { IAppart } from '../models/IAppart';
import { IConfig } from '../models/IConfig';

export interface IAggregator {
    GetAppartments(config: IConfig): Promise<IAppart[]>;
}