"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppartFilter {
    constructor(descExcludedKeywords) {
        this.DescExcludedKeywords = descExcludedKeywords || []; // lower case
    }
    Filter(apparts) {
        var filteredApparts = [];
        for (var i = 0; i < apparts.length; i++) {
            if (this.IsAppartValid(apparts[i])) {
                filteredApparts.push(apparts[i]);
            }
        }
        return filteredApparts;
    }
    IsAppartValid(appart) {
        for (var i = 0; i < this.DescExcludedKeywords.length; i++) {
            if (appart.description && appart.description.toLowerCase().includes(this.DescExcludedKeywords[i])) {
                return false;
            }
        }
        return true;
    }
}
exports.AppartFilter = AppartFilter;
