import * as request from 'request';
import * as cheerio from 'cheerio';
import { IAppart } from '../models/IAppart';
import { IAggregator } from './IAggregator';
import { RateLimitor } from './RateLimitor';
import { ConfigService } from './ConfigService';
import * as moment from 'moment';

export class SeLogerAggregator implements IAggregator {
    private _customHeaderRequest: any;
    private _rateLimitor: RateLimitor;
    private _apparts: { [id: string]: IAppart } = {};
    private _period = 180000;

    constructor(private _configService: ConfigService) {
        var maxQPS = 0.04;
        this._rateLimitor = new RateLimitor(maxQPS);

        this._customHeaderRequest = {
            headers: {
                'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'accept-language':'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6',
                'cache-control':'max-age=0',
                'Connection':'keep-alive',
                'Cookie': 'ASP.NET_SessionId=eqqtsxdzfd2qyvxbl1n112co; ABtestCreditImmo=ABtestCreditImmo_VersionB; SearchAnnDep=75; __uzma=maa433fcd9-9c2f-45c9-b248-513d078d620b5325; __uzmb=1560097845; theshield_consent={%22consentString%22:%22BOh4vD1Oh4vD1CyABBFRCW-AAAAn57_______9______9uz_Ov_v_f__33e87_9v_l_7_-___u_-3zd4u_1vf99yfm1-7etr3tp_87ues2_Xur__59__3z3_9phPrsk89r6337Ag%22}; _gcl_au=1.1.2132665933.1560090649; visitId=1560090648632-252172026; bannerCookie=1; AMCVS_366134FA53DB27860A490D44%40AdobeOrg=1; s_cc=true; mics_vid=6860682015; mics_lts=1560090649399; mics_uaid=web:1056:cbaabe30-640b-4fa0-8483-9b1d4d407f39; uid=cbaabe30-640b-4fa0-8483-9b1d4d407f39; mics_vid=6860682015; mics_lts=1560090649399; HistoAnnonces=PQAAAHicM6ypqTGAQUN9EDIwMFQwMLACI7A4VokaXcM6APo/D6Q=; FirstVisitSeLoger=09/06/2019 18:35:53; HistoRecherches=lwAAAHicDYtbCsIwEACvsl/1S5ptqJpi9ApeIbYrBMyDbIQKi3gUz+CpPIb5GgZmUM5+qc9MV0/RYtekNsze7keFaLq8BrdaVIPu+FFubqbgo9WtZKZkldzT7KpPkWHZuJxdqRQoVpYj4Kdt8O5D8iwn0AjhKyjK9GrXDwoN4GHS4zRqubjiGdD8AskWX3/1CTGH; newIsochrone=enabled; AMCV_366134FA53DB27860A490D44%40AdobeOrg=1099438348%7CMCIDTS%7C18072%7CMCMID%7C09475724884556414724070980757703979193%7CMCAAMLH-1561589635%7C6%7CMCAAMB-1562007505%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1561409905s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C2.1.0; s_visit=1; s_dl=1; c_m=undefinedlocalhost%3A8080Other%20Natural%20Referrersundefined; stack_ch=%5B%5B%27Autres%2520Sites%2520Organiques%27%2C%271560098131468%27%5D%2C%5B%27Acces%2520Direct%27%2C%271560156712942%27%5D%2C%5B%27Autres%2520Sites%2520Organiques%27%2C%271560984835964%27%5D%2C%5B%27Acces%2520Direct%27%2C%271561402705670%27%5D%2C%5B%27Autres%2520Sites%2520Organiques%27%2C%271561404629750%27%5D%5D; s_sq=%5B%5BB%5D%5D; s_getNewRepeat=1561407786568-Repeat; __uzmc=1744910940636; __uzmd=1561407789',
                'Host':'www.seloger.com',
                'upgrade-insecure-requests':'1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
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
        console.log(`${moment().format()}: [SeLoger] Sending request to Get Appartment id: ${id}`);
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

            console.log(`${moment().format()}: [SeLoger] Sending request to get all appartment ids`);
            const annoncesSearchUrl = this._configService.GetSeLogerSearchUrl();
            if (!annoncesSearchUrl || annoncesSearchUrl.length == 0) {
                resolve([]);
                return;
            }

            request(annoncesSearchUrl, this._customHeaderRequest, async (error, response, body) => {
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
                        let annonceUrl = resultats[i].attribs['href'].split("?")[0]
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
                    console.error(`${moment().format()}: Error parsing SeLoger in GetAnnonce`, url, e);
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
                    console.error(`${moment().format()}: Error parsing SeLoger in GetAnnonceJs`, url, e);
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
                    console.error(`${moment().format()}: Error parsing SeLoger in GetAnnonceJs`, url, e);
                }
            });
        });
    }
}
