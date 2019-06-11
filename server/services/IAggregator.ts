import { IAppart } from '../models/IAppart';

export interface IAggregator {
    GetAppartments(): Promise<IAppart[]>;
    Start(): void;
    ResetCache(): void;
}