import * as request from 'request';
import { JSDOM } from 'jsdom';
import { IAppart } from '../models/IAppart';
import { IAggregator } from './IAggregator';
import { RateLimitor } from './RateLimitor';
import { ConfigService } from './ConfigService';

export class PapAggregator implements IAggregator {
    private _customHeaderRequest: any;
    private _rateLimitor: RateLimitor;
    private _apparts: { [id: string]: IAppart } = {};
    private _period = 30000;

    constructor(private _configService: ConfigService) {
        var maxQPS = 1;
        this._rateLimitor = new RateLimitor(maxQPS);

        this._customHeaderRequest = {
            headers: {
                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Cache-Control':'max-age=0',
                'Connection':'keep-alive',
                'Cookie': 'cnil=1; acceptcookies=1; _ga=GA1.2.1828797042.1510687038; ABTasty=uid%3D17111420171909340%26fst%3D1510687039094%26pst%3Dnull%26cst%3D1510687039094%26ns%3D1%26pvt%3D1%26pvis%3D1%26th%3D; nb_resultats_par_page=10; lang=fr; email=dekajoo%40gmail.com; crypt=%241%24g4O3ARBi%240tSemjJZlHX7.q8SVdMJl%2F; derniere_recherche=%7B%22produit%22%3A%22location%22%2C%22nb_pieces%22%3A%7B%22min%22%3Anull%2C%22max%22%3Anull%7D%2C%22nb_chambres%22%3A%7B%22min%22%3Anull%2C%22max%22%3Anull%7D%2C%22prix%22%3A%7B%22min%22%3Anull%2C%22max%22%3A1000%7D%2C%22surface%22%3A%7B%22min%22%3A30%2C%22max%22%3Anull%7D%2C%22surface_terrain%22%3A%7B%22min%22%3Anull%2C%22max%22%3Anull%7D%2C%22geo_objets%22%3A%5B37769%2C37771%2C37775%2C37776%2C37777%2C37784%2C37785%2C37786%2C37787%5D%7D',
                'Host':'www.pap.fr',
                'Referer':'https://www.pap.fr/',
                'Upgrade-Insecure-Requests':'1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36',
            }
        };
    }

    public Start() {
        //Try moving Pap Start from 15sec so that it is not at the same time as SeLoger every 30s
        setTimeout(() => this.RefreshAppartmentsLoop(), 15000);
    }

    public ResetCache() {
        this._apparts = {};
    }

    public GetAppartments(): Promise<IAppart[]>{
        return (<any>Object).values(this._apparts);
    }

    private async RefreshAppartmentsLoop() {
        let newAppartIds = await this._rateLimitor.WaitAndQuery(() => this.GetAppartmentsIds());

        for (let i=0; i < newAppartIds.length; i++) {
            if (!this._apparts[newAppartIds[i]]) {
                let appart = await this._rateLimitor.WaitAndQuery(() => this.GetAppartment(newAppartIds[i]));
                if (appart)
                    this._apparts[newAppartIds[i]] = appart;
            }
        }

        setTimeout(() => this.RefreshAppartmentsLoop(), this._period);
    }

    private async GetAppartmentsIds(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            let annoncesSearchUrl = this._configService.GetPapSearchUrl();
            request(annoncesSearchUrl, this._customHeaderRequest, async (error, response, body) => {
                let appartIds: string[] = [];
                const dom = new JSDOM(body);
                try {
                    let resultats = dom.window.document.querySelector('.search-results-list').querySelectorAll('.search-list-item');

                    for (let i = 0; i < resultats.length; i++) {
                        //TODO: parallelise
                        let split = resultats[i].querySelector('.btn-4').getAttribute('href').split("-");
                        appartIds.push(split[split.length-1])
                    }

                    resolve(appartIds);
                } catch(e) {
                    console.error(e, annoncesSearchUrl, body)
                    resolve([]);
                }
            });
        });
    }

    private async GetAppartment(id: string): Promise<IAppart> {
        var url = this.GetDetailUrl(id);
        return new Promise<IAppart>((resolve, reject) => {
            request(url, this._customHeaderRequest, (error, response, body) => {
                try {
                    const dom = new JSDOM(body);

                    // Price
                    var price = dom.window.document.querySelector('.item-price').textContent.replace(/\s/g, '').replace(/\./g, '').split('€')[0];

                    // Desc & departement
                    var itemDesc = dom.window.document.querySelector('.item-description');
                    var departement = itemDesc.querySelector('h2').textContent.replace(/\s/g, '');
                    var description = itemDesc.querySelector('div').textContent.replace(/[\n\t\r]/g,"")

                    // SurfaceArea
                    var itemTags = dom.window.document.querySelector('.item-tags').querySelectorAll('li');
                    var surfaceArea : string;
                    for (var i = 0; i < itemTags.length; i++) {
                        itemTags[i].textContent.includes('m²');
                        surfaceArea = itemTags[i].textContent.replace(/\s/g, '').split('m')[0];
                    }

                    // Photos
                    var photos : string[] = [];
                    var carouselElt = dom.window.document.querySelector('.owl-carousel');
                    if (carouselElt) {
                        var photosElts = carouselElt.querySelectorAll('img');
                        for (var i = 0; i < photosElts.length; i++) {
                            photos.push(photosElts[i].getAttribute('src'));
                        }
                    }

                    resolve({
                        title: "TITLE PLACEHOLDER", //TODO
                        departement: departement,
                        photos: photos,
                        surfaceArea: Number(surfaceArea),
                        url: url,
                        description: description,
                        price: Number(price),
                        adCreatedByPro: false,
                        id: id,
                        origin: 'PaP'
                    });
                } catch(e) {
                    console.error(e, body);
                    resolve(null);
                }

            });
        });
    }

    private GetDetailUrl(id: string) { return `https://www.pap.fr/annonce/locations-${id}` }
}
