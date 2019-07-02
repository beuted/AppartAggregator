import * as request from 'request';
import * as cheerio from 'cheerio';
import { IAppart } from '../models/IAppart';
import { IAggregator } from './IAggregator';
import { RateLimitor } from './RateLimitor';
import { ConfigService } from './ConfigService';
import * as moment from 'moment';

export class SeLogerAggregator implements IAggregator {
    private _rateLimitor: RateLimitor;
    private _apparts: { [id: string]: IAppart } = {};
    private _period = 30000;

    constructor(private _configService: ConfigService) {
        var maxQPS = 0.04;
        this._rateLimitor = new RateLimitor(maxQPS);
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
        console.log(`${moment().format()}: [SeLoger] Sending request to Get Appartment id: ${id}`);
        let annonceUrl = decodeURIComponent(id);
        let annonce = await this.GetAnnonce(annonceUrl);
        if (!annonce)
            return null;

        let jsIdParts = annonceUrl.split('/');
        let jsId = jsIdParts[jsIdParts.length-1].split('.')[0];
        let annonceJs = await this.GetAnnonceJs(jsId);
        return {
            timestamp: Date.now(),
            title: '',
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

            console.log(`${moment().format()}: [SeLoger] Sending request to get all appartment ids`);
            const annoncesSearchUrl = this._configService.GetSeLogerSearchUrl();
            if (!annoncesSearchUrl || annoncesSearchUrl.length == 0) {
                resolve([]);
                return;
            }


            request(annoncesSearchUrl, this.getRequestOptions(), async (error, response, body) => {
                if (error) {
                    console.error(`${moment().format()}: Error querying SeLoger in GetAppartmentsIds for url ${annoncesSearchUrl}: ${error}`);
                    resolve([]);
                    return;
                }

                let appartIds: string[] = [];
                const $ = cheerio.load(body);
                try {
                    if ($(`input[id='recaptcha_response']`).length > 0) {
                        this._period += 1000;
                        console.warn(`${moment().format()}: [SeLoger] Request throttled ! Refresh period moved to ${this._period / 1000} sec`);
                        resolve([]);
                        return;
                    }

                    let resultats = $('.liste_resultat').find('.c-pa-list .c-pa-link');

                    for (let i = 0; i < resultats.length; i++) {
                        let annonceUrl = resultats[i].attribs['href'].split('?')[0]
                        appartIds.push(encodeURIComponent(annonceUrl));
                    }

                    resolve(appartIds);
                } catch(e) {
                    console.error(`${moment().format()}: [SeLoger] Error parsing SeLoger in GetAppartmentsIds`, annoncesSearchUrl, e);
                    resolve([]);
                }
            });
        });
    }

    private GetDetailUrl(id: string) { return `http://www.seloger.com/detail,json,caracteristique_bien.json?idannonce=${id}` }

    private async GetAnnonce(url: string): Promise<{departement: string, photos: string[], surfaceArea: number, url: string }> {
        return new Promise<{departement: string, photos: string[], surfaceArea: number, url: string }>((resolve, reject) => {
            request(url, this.getRequestOptions(), (error, response, body) => {
                if (error) {
                    console.error(`${moment().format()}: Error querying SeLoger in GetAnnonce for url ${url}: ${error}`);
                    resolve(null);
                    return;
                }
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
                        departement: departement,
                        photos: photos.filter((v,i) => photos.indexOf(v) === i), // Remove doubles
                        surfaceArea: Number(surfaceArea),
                        url: url
                    });
                } catch(e) {
                    console.error(`${moment().format()}: Error parsing SeLoger in GetAnnonce`, url, e);
                    resolve(null);
                }

            });
        });
    }

    private async GetAnnonceJs(id: string): Promise<{description: string, price: number}> {
         return new Promise<{description: string, price: number}>((resolve, reject) => {
            let url = this.GetDetailUrl(id);
            request(url, this.getRequestOptions(), (error, response, body) => {
                let resp: any;
                try {
                    resp = JSON.parse(body);
                } catch(e) {
                    console.error(`${moment().format()}: Error parsing SeLoger in GetAnnonceJs`, url, e);
                }

                try {
                    resolve({
                        description: resp.descriptif,
                        price: resp.infos_acquereur.prix.prix,
                    });
                } catch(e) {
                    console.error(`${moment().format()}: Error parsing SeLoger in GetAnnonceJs`, url, e);
                }
            });
        });
    }

    private getRequestOptions() {
        return {
            method: 'GET',
            headers: {
                'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'accept-language':'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6',
                'cache-control':'max-age=0',
                'Connection':'keep-alive',
                'Host':'www.seloger.com',
                'upgrade-insecure-requests':'1',
                'user-agent': Math.floor(Math.random()*10E10),
                'cookie': 'ASP.NET_SessionId=prh0cymmueud214zxtgho3vp; ABtestCreditImmo=ABtestCreditImmo_VersionB; SearchAnnDep=75; __uzma=ma5175578c-d115-425b-91c6-0957ebba8b7a9493; __uzmb=1560951373; atuserid=%7B%22name%22%3A%22atuserid%22%2C%22val%22%3A%22bd346df6-43d6-43e4-acba-35c6b4f3d9d7%22%2C%22options%22%3A%7B%22end%22%3A%222020-07-20T11%3A36%3A25.046Z%22%2C%22path%22%3A%22%2F%22%7D%7D; theshield_consent={%22consentString%22:%22BOiZS5rOiZS5rCyABBFRAk-AAAAXyABgACAvgA%22}; _gcl_au=1.1.27773782.1560944190; visitId=1560944190017-929568429; bannerCookie=1; _ga=GA1.2.2052748209.1560944190; AMCVS_366134FA53DB27860A490D44%40AdobeOrg=1; ry_ry-s3oa268o_realytics=eyJpZCI6InJ5XzdBODk2RjIyLUE1RDgtNEUxMC1CRDU1LUM2QUEwMzEyMjlGQSIsImNpZCI6bnVsbCwiZXhwIjoxNTkyNDgwMTkwMjc5LCJjcyI6bnVsbH0%3D; s_ecid=MCMID%7C09503269555173349122499371133635983679; s_cc=true; mics_vid=5488175977; mics_lts=1560944190834; mics_uaid=web:1056:812db48b-c124-4665-ba87-8595a9bbd32b; uid=812db48b-c124-4665-ba87-8595a9bbd32b; mics_vid=5488175977; mics_lts=1560944190834; ABCtestJacqueline_UserProject=required; newIsochrone=enabled; __gads=ID=63d6c53957cf450e:T=1561546014:S=ALNI_MYRDt0w-KrsOC591UWUMDxG6LUjdA; c_m=undefinedTyped%2FBookmarkedTyped%2FBookmarkedundefined; stack_ch=%5B%5B%27Acces%2520Direct%27%2C%271560944190457%27%5D%2C%5B%27Autres%2520Sites%2520Organiques%27%2C%271561546192558%27%5D%2C%5B%27Acces%2520Direct%27%2C%271561628397569%27%5D%5D; s_sq=%5B%5BB%5D%5D; AMCV_366134FA53DB27860A490D44%40AdobeOrg=1099438348%7CMCIDTS%7C18076%7CMCMID%7C09503269555173349122499371133635983679%7CMCAAMLH-1562233197%7C6%7CMCAAMB-1562342953%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1561745353s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C2.1.0; s_visit=1; s_dl=1; _gid=GA1.2.1721687218.1561738153; ry_ry-s3oa268o_so_realytics=eyJpZCI6InJ5XzdBODk2RjIyLUE1RDgtNEUxMC1CRDU1LUM2QUEwMzEyMjlGQSIsImNpZCI6bnVsbCwib3JpZ2luIjp0cnVlLCJyZWYiOm51bGwsImNvbnQiOm51bGwsIm5zIjpmYWxzZX0%3D; _gat_UA-482515-1=1; __uzmc='+Math.floor(Math.random()*10E10)+'; __uzmd='+(Date.now()+'').substring(0, 10)+'; s_getNewRepeat=1561739259878-Repeat;'
            },
            proxy: "http://85.47.31.179:3128",
        };
    }
}
