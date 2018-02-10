import * as request from 'request';
import { JSDOM } from 'jsdom';
import { IAppart } from '../models/IAppart';
import { IAggregator } from './IAggregator';

export class PapAggregator implements IAggregator {
    private _annoncesSearchUrl: string;
    private _customHeaderRequest: any;
    private _apparts: { [id: string]: IAppart } = {};
    private _lastApiCall: number = 0;
    private _maxQPS: number = 1;

    constructor() {
        this._annoncesSearchUrl = 'https://www.pap.fr/annonce/locations-paris-2e-g37769g37771g37775g37776g37777g37784g37785g37786g37787-jusqu-a-1000-euros-a-partir-de-30-m2';
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

        this.RefreshAppartments();

        setTimeout(() => this.RefreshAppartments(), 30000); //TODO: avoid calling refresh if prev refresh has not ended
    }

    public GetAppartments(): Promise<IAppart[]>{
        return (<any>Object).values(this._apparts);
    }

    private async WaitAndQuery<T>(f: () => Promise<T>): Promise<T> {
        const nextpermitedCallTime = this._lastApiCall + 1000 / this._maxQPS;
        if (Date.now() < nextpermitedCallTime) {
            await this.Sleep(nextpermitedCallTime - Date.now());
        }
        
        this._lastApiCall = Date.now();
        return await f();
    }

    private async Sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async RefreshAppartments() {
        let newAppartIds = await this.WaitAndQuery(() => this.GetAppartmentsIds());
        for (let i=0; i < newAppartIds.length; i++) {
            if (!this._apparts[newAppartIds[i]]) {
                this._apparts[newAppartIds[i]] = await this.WaitAndQuery(() => this.GetAppartment(newAppartIds[i]));
            }
        }
    }

    private GetDetailUrl(id: string) { return `https://www.pap.fr/annonce/locations-${id}` }

    public async GetAppartmentsIds(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            request(this._annoncesSearchUrl, this._customHeaderRequest, async (error, response, body) => {
                let appartIds: string[] = [];
                const dom = new JSDOM(body);
                try {
                    let resultats = dom.window.document.querySelector('.search-results-list').querySelectorAll('.search-list-item');

                    for (let i = 0; i < resultats.length; i++) {
                        //TODO: parallelise 
                        let split = resultats[i].querySelector('.btn-type-1').getAttribute('href').split("-");
                        appartIds.push(split[split.length-1])
                    }

                    resolve(appartIds);
                } catch(e) {
                    console.log(e, this._annoncesSearchUrl, body)
                    resolve([]);
                }
            });
        });
    }

    public async GetAppartment(id: string): Promise<IAppart> {
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
                    console.log(e, body);
                    resolve(null);
                }

            });
        });
    }
}
