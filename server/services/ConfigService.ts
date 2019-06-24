import * as storage from 'node-persist';

export class ConfigService {
    // Example: 75003, 75010, 75011, 75012, 75020, Min 50m2, Max 1600euros
    private _searchUrls = {
        seLoger: 'https://www.seloger.com/list.htm?types=1&projects=1&enterprise=0&price=1000%2F1600&surface=50%2FNaN&rooms=2%2C3&places=%5B%7Bci%3A750120%7D%7C%7Bci%3A750103%7D%7C%7Bci%3A750110%7D%7C%7Bci%3A750112%7D%7C%7Bci%3A750111%7D%5D&qsVersion=1.0',
        pap: 'https://www.pap.fr/annonce/locations-appartement-paris-3e-g37770g37777g37778g37779g37787-du-2-pieces-au-3-pieces-jusqu-a-1600-euros-a-partir-de-50-m2',
        bienIci: 'https://www.bienici.com/realEstateAds.json?filters=%7B%22size%22%3A24%2C%22from%22%3A0%2C%22filterType%22%3A%22rent%22%2C%22propertyType%22%3A%5B%22flat%22%5D%2C%22maxPrice%22%3A1600%2C%22minRooms%22%3A2%2C%22maxRooms%22%3A3%2C%22minGardenSurfaceArea%22%3A50%2C%22page%22%3A1%2C%22resultsPerPage%22%3A24%2C%22maxAuthorizedResults%22%3A2400%2C%22sortBy%22%3A%22relevance%22%2C%22sortOrder%22%3A%22desc%22%2C%22onTheMarket%22%3A%5Btrue%5D%2C%22mapMode%22%3A%22enabled%22%2C%22limit%22%3A%22sphiHm%7BvL%3F%7Big%40pnED%3Fnig%40%22%2C%22propertyType.base%22%3A%5B%22programme%22%5D%2C%22programmeWith3dFirst%22%3Atrue%2C%22showAllModels%22%3Afalse%2C%22blurInfoType%22%3A%5B%22disk%22%2C%22exact%22%5D%2C%22zoneIdsByTypes%22%3A%7B%22zoneIds%22%3A%5B%22-20742%22%2C%22-9528%22%2C%22-9533%22%2C%22-9525%22%2C%22-9529%22%5D%7D%7D&extensionType=extendedIfNoResult&access_token=LFtgLFLrQNoEk9K5K5IbdKW7upcWSmU%2FNgT1QLGNFK8%3D%3A5d1122366438b80ac9e2aa46&id=5d1122366438b80ac9e2aa46',
    };

    public GetSeLogerSearchUrl() {
        return this._searchUrls.seLoger;
    }

    public GetPapSearchUrl() {
        return this._searchUrls.pap;
    }

    public GetBienIciSearchUrl() {
        return this._searchUrls.bienIci;
    }

    public async GetConfig() {
        const excludedIds = await storage.getItem('excludedIds') || [];
        const excludedKeywords = await storage.getItem('excludedKeywords') || [];
        const searchUrls = await storage.getItem('searchUrls') || this._searchUrls;
        return {
            excludedIds: excludedIds,
            excludedKeywords: excludedKeywords,
            searchUrls: searchUrls
        }
    }

    public async SetSearchUrls(searchUrls: { seLoger: string, pap: string, bienIci: string }) {
        this._searchUrls = searchUrls;
        await storage.setItem('searchUrls', searchUrls);
    }
}