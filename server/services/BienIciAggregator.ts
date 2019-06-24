import * as request from 'request';
import { IAppart } from '../models/IAppart';
import { IAggregator } from './IAggregator';
import { IBienIciResponse } from '../models/IBienIciResponse';
import { ConfigService } from './ConfigService';

export class BienIciAggregator implements IAggregator {
    private _customHeaderRequest: any;

    constructor(private _configService: ConfigService) {
        this._customHeaderRequest = {
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhNjllNTg2ODVhMmU0MDA5YzVhZWQyZCIsImlhdCI6MTUxODI4NjI0MX0.wen_1q0PUZgi8iwnm200OIfCL9CPHgYGNvyJnxj089w',
                'Connection': 'keep-alive',
                'Cookie': 'i18next=fr; access_token=S%2BRuiF5%2FWzcgf4JNxDiH%2FNY%2BmUoM4pNBHN9fdY6h5UQ%3D%3A5a69e58685a2e4009c5aed2d; lastSearch=%7B%22locationNames%22%3A%5B%22Paris-75000%22%5D%2C%22filterType%22%3A%22rent%22%2C%22maxPrice%22%3A%22%22%2C%22minRooms%22%3A%22%22%2C%22newProperty%22%3Anull%7D; webGLBenchmarkScore=9.846468832631635',
                'Host': 'www.bienici.com',
                'Referer': 'https://www.bienici.com/recherche/location/paris-75000?camera=14_2.3467668_48.8511043_0.9_0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }
    }

    public Start() {
        // Nothing to start in this case
    }

    public ResetCache() {
        // Nothing to reset in this case
    }

    public GetAppartments(): Promise<IAppart[]> {
        return new Promise((resolve, reject) => {
            let annoncesSearchUrl = this._configService.GetBienIciSearchUrl();
            if (!annoncesSearchUrl || annoncesSearchUrl.length == 0) {
                resolve([]);
                return;
            }

            request(annoncesSearchUrl, this._customHeaderRequest, (error, response, body) => {
                let apparts : IAppart[] = [];
                let resp: IBienIciResponse;
                try {
                    resp = JSON.parse(body);
                } catch (e) {
                    console.error("Error parsing BienIci in GetAppartments", annoncesSearchUrl, e);
                }

                if (resp && resp.realEstateAds && resp.realEstateAds.length) {
                    for (var i = 0; i < resp.realEstateAds.length; i++) {
                        apparts.push({
                            title: resp.realEstateAds[i].title,
                            description: resp.realEstateAds[i].description.replace(/<br>/g, ' '),
                            departement: resp.realEstateAds[i].city,
                            photos: resp.realEstateAds[i].photos.map((p: any) => p.url),
                            price: resp.realEstateAds[i].price,
                            adCreatedByPro: resp.realEstateAds[i].adCreatedByPro,
                            //district: resp.realEstateAds[i].district.name,
                            surfaceArea: resp.realEstateAds[i].surfaceArea,
                            url: `https://www.bienici.com/annonce/location/${resp.realEstateAds[i].city.replace(' ', '-')}/appartement/${resp.realEstateAds[i].roomsQuantity}pieces/${resp.realEstateAds[i].id}`,
                            id: resp.realEstateAds[i].id,
                            origin: 'BienIci',
                            notes: null
                        });
                    }
                }

                resolve(apparts);
            });
        });

    }
}
