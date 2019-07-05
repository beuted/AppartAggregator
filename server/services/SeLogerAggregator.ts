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
        let dayHour = new Date().getHours();
        if (dayHour > 22 || dayHour < 6) {
            console.log(`${moment().format()}: [SeLoger] Ignoring refresh due to late hour (between 22:00 and 6:00)`);
            setTimeout(() => this.RefreshAppartmentsLoop(), this._period);
            return;
        }

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
        let atuserid = {
            name: "atuserid",
            val: this.generateGuid(),
            options: {end:"2020-08-05T08:38:15.467Z", path:"/"}
        }

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
                'cookie': '__uzma='+ this.generateGuid() +'; __uzmb='+((Date.now()-1000000)+'').substring(0, 10)+'; atuserid='+ atuserid +'; __uzmc='+Math.floor(Math.random()*10E10)+'; __uzmd='+(Date.now()+'').substring(0, 10)+'; s_getNewRepeat=1561739259878-Repeat;'
            },
            //proxy: "http://85.47.31.179:3128",
        };
    }

    private generateGuid() {
        function S4() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }

        // then to call it, plus stitch in '4' in the third group
        return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
    }

}
