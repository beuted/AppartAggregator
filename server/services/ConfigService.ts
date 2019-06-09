import * as storage from 'node-persist';

export class ConfigService {
    private _searchUrls = {
        seLoger: 'http://www.seloger.com/list.htm?ci=750102,750104,750108,750109,750110,750117,750118,750119,750120&idtt=1&idtypebien=1,2&naturebien=1&nb_pieces=2&pxmax=1000&surfacemin=30&tri=initial',
        pap: 'https://www.pap.fr/annonce/locations-paris-2e-g37769g37771g37775g37776g37777g37784g37785g37786g37787-jusqu-a-1000-euros-a-partir-de-30-m2',
        bienIci: 'https://www.bienici.com/realEstateAds.json?filters=%7B%22size%22%3A24%2C%22from%22%3A0%2C%22filterType%22%3A%22rent%22%2C%22propertyType%22%3A%5B%22house%22%2C%22flat%22%5D%2C%22maxPrice%22%3A1000%2C%22minRooms%22%3A2%2C%22minArea%22%3A30%2C%22page%22%3A1%2C%22resultsPerPage%22%3A24%2C%22maxAuthorizedResults%22%3A2400%2C%22sortBy%22%3A%22relevance%22%2C%22sortOrder%22%3A%22desc%22%2C%22onTheMarket%22%3A%5Btrue%5D%2C%22showAllModels%22%3Afalse%2C%22zoneIdsByTypes%22%3A%7B%22drawnZone%22%3A%5B%225a69ea858b2d07009dc83d8d%22%5D%7D%7D&extensionType=extendedIfNoResult&highlightedCount=2&access_token=S%2BRuiF5%2FWzcgf4JNxDiH%2FNY%2BmUoM4pNBHN9fdY6h5UQ%3D%3A5a69e58685a2e4009c5aed2d&id=5a69e58685a2e4009c5aed2d',
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