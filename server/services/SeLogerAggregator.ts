import * as request from 'request';
import * as cheerio from 'cheerio';
import { IAppart } from '../models/IAppart';
import { IAggregator } from './IAggregator';
import { RateLimitor } from './RateLimitor';
import { ConfigService } from './ConfigService';;

export class SeLogerAggregator implements IAggregator {
    private _customHeaderRequest: any;
    private _rateLimitor: RateLimitor;
    private _apparts: { [id: string]: IAppart } = {};
    private _period = 30000;

    constructor(private _configService: ConfigService) {
        var maxQPS = 0.1;
        this._rateLimitor = new RateLimitor(maxQPS);

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
    }

    public Start() {
        this.RefreshAppartmentsLoop();
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

    private async GetAppartment(id: string): Promise<IAppart> {
        let annonceUrl = decodeURIComponent(id);
        let annonce = await this.GetAnnonce(annonceUrl);
        if (!annonce)
            return null;

        let jsIdParts = annonceUrl.split('/');
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
            origin: 'SeLoger',
            notes: null
        };
    }

    private async GetAppartmentsIds(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            let annoncesSearchUrl = this._configService.GetSeLogerSearchUrl();
            request(annoncesSearchUrl, this._customHeaderRequest, async (error, response, body) => {
                let appartIds: string[] = [];
                const $ = cheerio.load(body);
                try {
                    let resultats = $('.liste_resultat').find('.c-pa-list .c-pa-link');

                    for (let i = 0; i < resultats.length; i++) {
                        let annonceUrl = resultats[i].attribs['href'].split("?")[0]
                        appartIds.push(encodeURIComponent(annonceUrl));
                    }

                    resolve(appartIds);
                } catch(e) {
                    console.error("Error parsing SeLoger in GetAppartmentsIds", annoncesSearchUrl, e);
                    resolve([]);
                }
            });
        });
    }

    private GetDetailUrl(id: string) { return `http://www.seloger.com/detail,json,caracteristique_bien.json?idannonce=${id}` }

    private async GetAnnonce(url: string): Promise<IAppart> {
        return new Promise<IAppart>((resolve, reject) => {
            request(url, this._customHeaderRequest, (error, response, body) => {
                try {
                    const $ = cheerio.load(body);
                    let resume = $('.resume');

                    let departement = $(resume).find('.localite').first().text();
                    //let price = resume.querySelector('.price').textContent.replace(/\s/g, '').split('€')[0];
                    let surfaceArea =  $(resume).find('.criterion > li').eq(2).text().replace(/\s/g, '').split('m')[0].replace(',', '.');

                    let photosDoms = $('.carrousel_slide');

                    let photos: string[] = [];

                    // Last slide is some seloger shit
                    for (let i = 0; i < photosDoms.length - 1; i++) {
                        let bgImg = (photosDoms.eq(i)).css('background-image');
                        if (bgImg) {
                            photos.push(bgImg.substring(4, bgImg.length-1));
                        } else {
                            let dataLazyAttr = photosDoms.eq(i).attr('data-lazy');
                            let dataLazyAttrObj = JSON.parse(dataLazyAttr)
                            photos.push(dataLazyAttrObj.url);
                        }
                    }

                    resolve({
                        title: "",
                        departement: departement,
                        photos: photos.filter((v,i) => photos.indexOf(v) === i), // Remove doubles
                        surfaceArea: Number(surfaceArea),
                        url: url,
                        description: undefined,
                        price: undefined,
                        adCreatedByPro: undefined,
                        id: undefined,
                        origin: undefined,
                        notes: null
                    });
                } catch(e) {
                    console.error("Error parsing SeLoger in GetAnnonce", url, e);
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
                    console.error("Error parsing SeLoger in GetAnnonceJs", url, e);
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
                        origin: undefined,
                        notes: null
                    });
                } catch(e) {
                    console.error("Error parsing SeLoger in GetAnnonceJs", url, e);
                }
            });
        });
    }
}
