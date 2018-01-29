let request = require('request');
const { JSDOM } = require('jsdom');

module.exports = class SeLogerAggregator {
    constructor() {
        this.AnnoncesSearchUrl = 'http://www.seloger.com/list.htm?ci=750102,750104,750108,750109,750110,750117,750118,750119,750120&idtt=1&idtypebien=1,2&naturebien=1&nb_pieces=2&pxmax=1000&surfacemin=30&tri=initial';
    }

    GetDetailUrl(id) { return `http://www.seloger.com/detail,json,caracteristique_bien.json?idannonce=${id}` }

    async GetAppartments() {
        return new Promise((resolve, reject) => {
            request(this.AnnoncesSearchUrl, async (error, response, body) => {
                let annonces = [];
                const dom = new JSDOM(body);
                let resultats = dom.window.document.querySelector(".liste_resultat").querySelectorAll('.c-pa-list');

                for (let i = 0; i < resultats.length; i++) {
                    //TODO: parallelise
                    let annonce = await this.GetAnnonce(
                        resultats[i].querySelector('.c-pa-link').getAttribute('href').split("?")[0]
                    );
                    let id = resultats[i].getAttribute('data-listing-id');
                    let annonceJs = await this.GetAnnonceJs(id);
                    annonces.push({
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

                resolve(annonces);
            });
        });
    }

    async GetAnnonce(url) {
        return new Promise((resolve, reject) => {
            request(url, (error, response, body) => {
                const dom = new JSDOM(body);
                let resume = dom.window.document.querySelector(".resume");

                let departement = resume.querySelector('.localite').textContent;
                //let price = resume.querySelector(".price").textContent.replace(/\s/g, '').split('€')[0];
                let surfaceArea = resume.querySelector('.criterion').querySelectorAll('li')[2].textContent.replace(/\s/g, '').split('m')[0];

                let photosDoms = dom.window.document.querySelectorAll('.carrousel_slide');

                let photos = [];

                // Last slide is some seloger shit
                for (let i =0; i < photosDoms.length - 1; i++) {
                    let bgImg = photosDoms[i].style["background-image"]
                    if (bgImg) {
                        photos.push(bgImg.substring(4, bgImg.length-1));
                    } else {
                        let dataLazyAttr = photosDoms[i].getAttribute('data-lazy');
                        let dataLazyAttrObj = JSON.parse(dataLazyAttr)
                        photos.push(dataLazyAttrObj.url);
                    }
                }

                resolve({
                    title: "TITLE PLACEHOLDER",
                    departement: departement,
                    photos: photos,
                    surfaceArea: surfaceArea,
                    url: url
                });
            });
        });
    }

    async GetAnnonceJs(id) {
         return new Promise((resolve, reject) => {
            request(this.GetDetailUrl(id), (error, response, body) => {
                let resp;
                try {
                    resp = JSON.parse(body);
                } catch(e) {
                    console.log(`failed to parse body: ${body}`);
                }
                
                resolve({
                    description: resp.descriptif,
                    price: resp.infos_acquereur.prix.prix,
                });
            });
        });
    }
}
