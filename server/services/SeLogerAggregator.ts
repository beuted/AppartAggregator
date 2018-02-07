import * as request from 'request';
import { JSDOM } from 'jsdom';
import { IAppart } from '../models/IAppart';

export  class SeLogerAggregator {
    private AnnoncesSearchUrl: string;

    constructor() {
        this.AnnoncesSearchUrl = 'http://www.seloger.com/list.htm?ci=750102,750104,750108,750109,750110,750117,750118,750119,750120&idtt=1&idtypebien=1,2&naturebien=1&nb_pieces=2&pxmax=1000&surfacemin=30&tri=initial';
    }

    private GetDetailUrl(id: string) { return `http://www.seloger.com/detail,json,caracteristique_bien.json?idannonce=${id}` }

    public async GetAppartments(): Promise<IAppart[]> {
        return new Promise<IAppart[]>((resolve, reject) => {
            request(this.AnnoncesSearchUrl, async (error, response, body) => {
                let apparts: IAppart[] = [];
                const dom = new JSDOM(body);
                let resultats = dom.window.document.querySelector(".liste_resultat").querySelectorAll('.c-pa-list');

                for (let i = 0; i < resultats.length; i++) {
                    //TODO: parallelise
                    let annonce = await this.GetAnnonce(
                        resultats[i].querySelector('.c-pa-link').getAttribute('href').split("?")[0]
                    );
                    let id = resultats[i].getAttribute('data-listing-id');
                    let annonceJs = await this.GetAnnonceJs(id);
                    apparts.push({
                        title: annonce.title,
                        description: annonceJs.description,
                        departement: annonce.departement,
                        photos: annonce.photos,
                        price: annonceJs.price,
                        adCreatedByPro: true,
                        surfaceArea: annonce.surfaceArea,
                        url: annonce.url,
                        id: id,
                        origin: 'SeLoger'
                    });
                }

                resolve(apparts);
            });
        });
    }

    async GetAnnonce(url: string): Promise<IAppart> {
        return new Promise<IAppart>((resolve, reject) => {
            request(url, (error, response, body) => {
                const dom = new JSDOM(body);
                let resume = dom.window.document.querySelector(".resume");

                let departement = resume.querySelector('.localite').textContent;
                //let price = resume.querySelector(".price").textContent.replace(/\s/g, '').split('€')[0];
                let surfaceArea = resume.querySelector('.criterion').querySelectorAll('li')[2].textContent.replace(/\s/g, '').split('m')[0];

                let photosDoms = dom.window.document.querySelectorAll('.carrousel_slide');

                let photos: string[] = [];

                // Last slide is some seloger shit
                for (let i =0; i < photosDoms.length - 1; i++) {
                    let bgImg = (<any>photosDoms[i]).style["background-image"]
                    if (bgImg) {
                        photos.push(bgImg.substring(4, bgImg.length-1));
                    } else {
                        let dataLazyAttr = photosDoms[i].getAttribute('data-lazy');
                        let dataLazyAttrObj = JSON.parse(dataLazyAttr)
                        photos.push(dataLazyAttrObj.url);
                    }
                }

                resolve({
                    title: "TITLE PLACEHOLDER", //TODO
                    departement: departement,
                    photos: photos,
                    surfaceArea: Number(surfaceArea),
                    url: url,
                    description: undefined,        
                    price: undefined,
                    adCreatedByPro: undefined,
                    id: undefined,
                    origin: undefined
                });
            });
        });
    }

    async GetAnnonceJs(id: string): Promise<IAppart> {
         return new Promise<IAppart>((resolve, reject) => {
            request(this.GetDetailUrl(id), (error, response, body) => {
                let resp: any;
                try {
                    resp = JSON.parse(body);
                } catch(e) {
                    console.log(`failed to parse body: ${body}`);
                }
                
                resolve({
                    description: resp.descriptif,
                    price: resp.infos_acquereur.prix.prix,
                    title:  undefined,
                    departement:  undefined,
                    photos:  undefined,
                    surfaceArea:  undefined,
                    url:  undefined,
                    adCreatedByPro: undefined,
                    id: undefined,
                    origin: undefined
                });
            });
        });
    }
}
