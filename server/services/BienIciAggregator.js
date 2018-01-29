var request = require('request');

module.exports = class BienIciAggregator {
    constructor() {
        this.Url = 'https://www.bienici.com/realEstateAds.json?filters=%7B%22size%22%3A24%2C%22from%22%3A0%2C%22filterType%22%3A%22rent%22%2C%22propertyType%22%3A%5B%22house%22%2C%22flat%22%5D%2C%22maxPrice%22%3A1000%2C%22minRooms%22%3A2%2C%22minArea%22%3A30%2C%22page%22%3A1%2C%22resultsPerPage%22%3A24%2C%22maxAuthorizedResults%22%3A2400%2C%22sortBy%22%3A%22relevance%22%2C%22sortOrder%22%3A%22desc%22%2C%22onTheMarket%22%3A%5Btrue%5D%2C%22showAllModels%22%3Afalse%2C%22zoneIdsByTypes%22%3A%7B%22drawnZone%22%3A%5B%225a69ea858b2d07009dc83d8d%22%5D%7D%7D&extensionType=extendedIfNoResult&highlightedCount=2&access_token=S%2BRuiF5%2FWzcgf4JNxDiH%2FNY%2BmUoM4pNBHN9fdY6h5UQ%3D%3A5a69e58685a2e4009c5aed2d&id=5a69e58685a2e4009c5aed2d';
    }

    async GetAppartments() {
        return new Promise((resolve, reject) => {
            request(this.Url, (error, response, body) => {
                var apparts = [];
                var resp = JSON.parse(body);
                if (resp.realEstateAds && resp.realEstateAds.length) {
                    for (var i = 0; i < resp.realEstateAds.length; i++) {
                        apparts.push({
                            title: resp.realEstateAds[i].title,
                            description: resp.realEstateAds[i].description,
                            departement: resp.realEstateAds[i].city,
                            photos: resp.realEstateAds[i].photos.map(p => p.url),
                            price: resp.realEstateAds[i].price,
                            adCreatedByPro: resp.realEstateAds[i].adCreatedByPro,
                            //district: resp.realEstateAds[i].district.name,
                            surfaceArea: resp.realEstateAds[i].surfaceArea,
                            url: `https://www.bienici.com/annonce/location/${resp.realEstateAds[i].city.replace(' ', '-')}/appartement/${resp.realEstateAds[i].roomsQuantity}pieces/${resp.realEstateAds[i].id}`,
                            id: resp.realEstateAds[i].id,
                            origin: 'BienIci'
                        });
                    }
                }

                resolve(apparts);
            });
        });
    }
}
