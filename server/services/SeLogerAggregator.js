"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const jsdom_1 = require("jsdom");
class SeLogerAggregator {
    constructor() {
        this.AnnoncesSearchUrl = 'http://www.seloger.com/list.htm?ci=750102,750104,750108,750109,750110,750117,750118,750119,750120&idtt=1&idtypebien=1,2&naturebien=1&nb_pieces=2&pxmax=1000&surfacemin=30&tri=initial';
    }
    GetDetailUrl(id) { return `http://www.seloger.com/detail,json,caracteristique_bien.json?idannonce=${id}`; }
    GetAppartments() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                request(this.AnnoncesSearchUrl, (error, response, body) => __awaiter(this, void 0, void 0, function* () {
                    let apparts = [];
                    const dom = new jsdom_1.JSDOM(body);
                    try {
                        let resultats = dom.window.document.querySelector('.liste_resultat').querySelectorAll('.c-pa-list');
                        for (let i = 0; i < resultats.length; i++) {
                            //TODO: parallelise 
                            let annonce = yield this.GetAnnonce(resultats[i].querySelector('.c-pa-link').getAttribute('href').split("?")[0]);
                            if (!annonce)
                                break;
                            let id = resultats[i].getAttribute('data-listing-id');
                            let annonceJs = yield this.GetAnnonceJs(id);
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
                    }
                    catch (e) {
                        console.log(e);
                        console.log(this.AnnoncesSearchUrl);
                        resolve([]);
                    }
                }));
            });
        });
    }
    GetAnnonce(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                request(url, (error, response, body) => {
                    try {
                        const dom = new jsdom_1.JSDOM(body);
                        let resume = dom.window.document.querySelector(".resume");
                        let departement = resume.querySelector('.localite').textContent;
                        //let price = resume.querySelector(".price").textContent.replace(/\s/g, '').split('€')[0];
                        let surfaceArea = resume.querySelector('.criterion').querySelectorAll('li')[2].textContent.replace(/\s/g, '').split('m')[0];
                        let photosDoms = dom.window.document.querySelectorAll('.carrousel_slide');
                        let photos = [];
                        // Last slide is some seloger shit
                        for (let i = 0; i < photosDoms.length - 1; i++) {
                            let bgImg = photosDoms[i].style["background-image"];
                            if (bgImg) {
                                photos.push(bgImg.substring(4, bgImg.length - 1));
                            }
                            else {
                                let dataLazyAttr = photosDoms[i].getAttribute('data-lazy');
                                let dataLazyAttrObj = JSON.parse(dataLazyAttr);
                                photos.push(dataLazyAttrObj.url);
                            }
                        }
                        resolve({
                            title: "TITLE PLACEHOLDER",
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
                    }
                    catch (e) {
                        console.log(e);
                        resolve(null);
                    }
                });
            });
        });
    }
    GetAnnonceJs(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                request(this.GetDetailUrl(id), (error, response, body) => {
                    let resp;
                    try {
                        resp = JSON.parse(body);
                    }
                    catch (e) {
                        console.log(`failed to parse body: ${body}`);
                    }
                    resolve({
                        description: resp.descriptif,
                        price: resp.infos_acquereur.prix.prix,
                        title: undefined,
                        departement: undefined,
                        photos: undefined,
                        surfaceArea: undefined,
                        url: undefined,
                        adCreatedByPro: undefined,
                        id: undefined,
                        origin: undefined
                    });
                });
            });
        });
    }
}
exports.SeLogerAggregator = SeLogerAggregator;
