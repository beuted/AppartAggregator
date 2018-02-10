import * as request from 'request';
import { JSDOM, VirtualConsole } from 'jsdom';
import { IAppart } from '../models/IAppart';
import { IAggregator } from './IAggregator';

export  class SeLogerAggregator implements IAggregator {
    private _annoncesSearchUrl: string;
    private _customHeaderRequest: any;
    private _virtualConsole: VirtualConsole;
    private _apparts: { [id: string]: IAppart } = {};
    private _lastApiCall: number = 0;
    private _maxQPS: number = 0.1;

    constructor() {
        this._virtualConsole = new VirtualConsole();
        this._virtualConsole.sendTo(console, { omitJSDOMErrors: true });

        this._annoncesSearchUrl = 'http://www.seloger.com/list.htm?ci=750102,750104,750108,750109,750110,750117,750118,750119,750120&idtt=1&idtypebien=1,2&naturebien=1&nb_pieces=2&pxmax=1000&surfacemin=30&tri=initial';
        this._customHeaderRequest = {
            headers: {
                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language':'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6',
                'Cache-Control':'max-age=0',
                'Connection':'keep-alive',
                'Cookie': 'google; false; b8534ef1-92ca-40ed-96ef-3c44b6d7bc95; __uzma=; __uzmb=; __uzmc=; __uzmd=; bannerCookie=; dtCookie=|U2VMb2dlcnww; AMCVS_366134FA53DB27860A490D44%40AdobeOrg=1; s_cc=true; ry_ry-s3oa268o_realytics=eyJpZCI6InJ5X0Y2ODgxQzgxLTNFMDItNDhGNi1BRUI4LTgwQjIyRkYxQUE0NSIsImNpZCI6bnVsbCwiZXhwIjoxNTQ5NTYwMTAxNDE3fQ%3D%3D; _ga=GA1.2.870911222.1518024100; visitId=3cb0c454-33c5-42e6-8d5b-1cff7cbc448c; SearchAnnDep=75; FirstVisitSeLoger=07/02/2018 18:24:08; __gads=ID=c77edc14e4cd2fe8:T=1518024250:S=ALNI_Ma-03B7bHvjZ_6D_TzQU9aFRqa22A; s_sq=%5B%5BB%5D%5D; c_m=AL-SLG-ExclusifundefinedAlertes%20Emailundefined; stack_ch=%5B%5B%27Acces%2520Direct%27%2C%271518024172338%27%5D%2C%5B%27Alertes%2520Email%27%2C%271518118256074%27%5D%5D; stack_cmp=%5B%5B%27AL-SLG-Exclusif%27%2C%271518118256075%27%5D%5D; _gid=GA1.2.1449993640.1518214182; AMCV_366134FA53DB27860A490D44%40AdobeOrg=1099438348%7CMCIDTS%7C17572%7CMCMID%7C38460235659785561291137486940699461131%7CMCAAMLH-1518628900%7C6%7CMCAAMB-1518888146%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1518290546s%7CNONE%7CMCAID%7CNONE%7CMCSYNCSOP%7C411-17577%7CvVersion%7C2.1.0; s_dl=1; ry_ry-s3oa268o_so_realytics=eyJpZCI6InJ5X0Y2ODgxQzgxLTNFMDItNDhGNi1BRUI4LTgwQjIyRkYxQUE0NSIsImNpZCI6bnVsbCwib3JpZ2luIjpmYWxzZSwicmVmIjpudWxsLCJjb250IjpudWxsfQ%3D%3D; s_getNewRepeat=1518284223722-Repeat; _gat=1',
                'Host':'www.seloger.com',
                'Upgrade-Insecure-Requests':'1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36',
            }
        };

        this.RefreshAppartments();

        setTimeout(() => this.RefreshAppartments(), 30000)
    }

    private async WaitAndQuery<T>(f: () => Promise<T>): Promise<T> {
        const nextpermitedCallTime = this._lastApiCall + 1000 / this._maxQPS;
        if (Date.now() < nextpermitedCallTime) {
            await this.Sleep(nextpermitedCallTime - Date.now());
        }
        
        this._lastApiCall = Date.now();
        return await f();
    }

    public GetAppartments(): Promise<IAppart[]>{
        return (<any>Object).values(this._apparts);
    }

    private GetDetailUrl(id: string) { return `http://www.seloger.com/detail,json,caracteristique_bien.json?idannonce=${id}` }

    private async RefreshAppartments() {
        let newAppartIds = await this.WaitAndQuery(() => this.GetAppartmentsIds());
        for (let i=0; i < newAppartIds.length; i++) {
            if (!this._apparts[newAppartIds[i]]) {
                this._apparts[newAppartIds[i]] = await this.WaitAndQuery(() => this.GetAppartment(newAppartIds[i]));
            }
        }
    }

    private async GetAppartmentsIds(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            request(this._annoncesSearchUrl, this._customHeaderRequest, async (error, response, body) => {
                let appartIds: string[] = [];
                const dom = new JSDOM(body, { virtualConsole: this._virtualConsole });
                try {
                    let resultats = dom.window.document.querySelector('.liste_resultat').querySelectorAll('.c-pa-list');

                    for (let i = 0; i < resultats.length; i++) {
                        appartIds.push(resultats[i].querySelector('.c-pa-link').getAttribute('href').split("?")[0]);
                    }

                    resolve(appartIds);
                } catch(e) {
                    console.log(e, this._annoncesSearchUrl, body);
                    resolve([]);
                }
            });
        });
    }

    public async GetAppartment(id: string): Promise<IAppart> {
        let annonce = await this.GetAnnonce(id);
        if (!annonce)
            return null;

        let jsIdParts = id.split('/');
        let jsId = jsIdParts[jsIdParts.length-1].split('.')[0];
        let annonceJs = await this.GetAnnonceJs(jsId);
        return {
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
        };
    }

    private async GetAnnonce(url: string): Promise<IAppart> {
        return new Promise<IAppart>((resolve, reject) => {
            request(url, this._customHeaderRequest, (error, response, body) => {
                try {
                    const dom = new JSDOM(body, { virtualConsole: this._virtualConsole });
                    let resume = dom.window.document.querySelector('.resume');

                    let departement = resume.querySelector('.localite').textContent;
                    //let price = resume.querySelector('.price').textContent.replace(/\s/g, '').split('€')[0];
                    let surfaceArea = resume.querySelector('.criterion').querySelectorAll('li')[2].textContent.replace(/\s/g, '').split('m')[0];

                    let photosDoms = dom.window.document.querySelectorAll('.carrousel_slide');

                    let photos: string[] = [];

                    // Last slide is some seloger shit
                    for (let i =0; i < photosDoms.length - 1; i++) {
                        let bgImg = (<any>photosDoms[i]).style['background-image']
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
                } catch(e) {
                    console.log(e);
                    resolve(null);
                }

            });
        });
    }

    private async GetAnnonceJs(id: string): Promise<IAppart> {
         return new Promise<IAppart>((resolve, reject) => {
            let url = this.GetDetailUrl(id);
            request(url, this._customHeaderRequest, (error, response, body) => {
                let resp: any;
                try {
                    resp = JSON.parse(body);
                } catch(e) {
                    console.log(`failed to parse body: ${body}`);
                }
                
                try {
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
                } catch(e) {
                    console.log(e, "url: ", url, "body: ", body);
                }
            });
        });
    }

    private async Sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
