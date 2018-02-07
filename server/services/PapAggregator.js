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
class PapAggregator {
    constructor() {
        this.AnnoncesSearchUrl = 'https://www.pap.fr/annonce/locations-paris-2e-g37769g37771g37775g37776g37777g37784g37785g37786g37787-jusqu-a-1000-euros-a-partir-de-30-m2';
    }
    GetDetailUrl(id) { return `https://www.pap.fr/annonce/locations-${id}`; }
    GetAppartments() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                request(this.AnnoncesSearchUrl, (error, response, body) => __awaiter(this, void 0, void 0, function* () {
                    let apparts = [];
                    const dom = new jsdom_1.JSDOM(body);
                    try {
                        let resultats = dom.window.document.querySelector('.search-results-list').querySelectorAll('.search-list-item');
                        for (let i = 0; i < resultats.length; i++) {
                            //TODO: parallelise 
                            let split = resultats[i].querySelector('.btn-type-1').getAttribute('href').split("-");
                            let annonce = yield this.GetAnnonce(split[split.length - 1]);
                            if (!annonce)
                                break;
                            apparts.push(annonce);
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
    GetAnnonce(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var url = this.GetDetailUrl(id);
            return new Promise((resolve, reject) => {
                request(url, (error, response, body) => {
                    try {
                        const dom = new jsdom_1.JSDOM(body);
                        // Price
                        var price = dom.window.document.querySelector('.item-price').textContent.replace(/\s/g, '').split('€')[0];
                        // Desc & departement
                        var itemDesc = dom.window.document.querySelector('.item-description');
                        var departement = itemDesc.querySelector('h2').textContent.replace(/\s/g, '');
                        var description = itemDesc.querySelector('div').textContent.replace(/[\n\t\r]/g, "");
                        // SurfaceArea
                        var itemTags = dom.window.document.querySelector('.item-tags').querySelectorAll('li');
                        var surfaceArea;
                        for (var i = 0; i < itemTags.length; i++) {
                            itemTags[i].textContent.includes('m²');
                            surfaceArea = itemTags[i].textContent.replace(/\s/g, '').split('m')[0];
                        }
                        // Photos
                        var photosElts = dom.window.document.querySelector('.owl-carousel').querySelectorAll('img');
                        var photos = [];
                        for (var i = 0; i < photosElts.length; i++) {
                            photos.push(photosElts[i].getAttribute('src'));
                        }
                        resolve({
                            title: "TITLE PLACEHOLDER",
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
                    }
                    catch (e) {
                        console.log(e, body);
                        resolve(null);
                    }
                });
            });
        });
    }
}
exports.PapAggregator = PapAggregator;
