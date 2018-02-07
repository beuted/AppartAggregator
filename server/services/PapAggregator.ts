import * as request from 'request';
import { JSDOM } from 'jsdom';
import { IAppart } from '../models/IAppart';
import { IAggregator } from './IAggregator';

export class PapAggregator implements IAggregator {
    private AnnoncesSearchUrl: string;

    constructor() {
        this.AnnoncesSearchUrl = 'https://www.pap.fr/annonce/locations-paris-2e-g37769g37771g37775g37776g37777g37784g37785g37786g37787-jusqu-a-1000-euros-a-partir-de-30-m2';
    }

    private GetDetailUrl(id: string) { return `https://www.pap.fr/annonce/locations-${id}` }

    public async GetAppartments(): Promise<IAppart[]> {
        return new Promise<IAppart[]>((resolve, reject) => {
            request(this.AnnoncesSearchUrl, async (error, response, body) => {
                let apparts: IAppart[] = [];
                const dom = new JSDOM(body);
                try {
                    let resultats = dom.window.document.querySelector('.search-results-list').querySelectorAll('.search-list-item');

                    for (let i = 0; i < resultats.length; i++) {
                        //TODO: parallelise 
                        let split = resultats[i].querySelector('.btn-type-1').getAttribute('href').split("-");
                        let annonce = await this.GetAnnonce(split[split.length-1]);

                        if (!annonce)
                            break;

                        apparts.push(annonce);
                    }

                    resolve(apparts);
                } catch(e) {
                    console.log(e)
                    console.log(this.AnnoncesSearchUrl)
                    resolve([]);
                }
            });
        });
    }

    async GetAnnonce(id: string): Promise<IAppart> {
        var url = this.GetDetailUrl(id);
        return new Promise<IAppart>((resolve, reject) => {
            request(url, (error, response, body) => {
                try {
                    const dom = new JSDOM(body);
               
                    // Price
                    var price = dom.window.document.querySelector('.item-price').textContent.replace(/\s/g, '').split('€')[0];
                    
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
                    var photosElts = dom.window.document.querySelector('.owl-carousel').querySelectorAll('img');
                    var photos : string[] = [];
                    for (var i = 0; i < photosElts.length; i++) {   
                        photos.push(photosElts[i].getAttribute('src'));
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
