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
const express = require("express");
const request = require("request");
const http = require("http");
const socketio = require("socket.io");
const AppartCache_1 = require("./services/AppartCache");
const BienIciAggregator_1 = require("./services/BienIciAggregator");
const SeLogerAggregator_1 = require("./services/SeLogerAggregator");
const PapAggregator_1 = require("./services/PapAggregator");
const AppartFilter_1 = require("./services/AppartFilter");
const app = express();
const instance = http.createServer(app);
const io = socketio(instance);
const port = process.env['PORT'] || 3000;
const bienIciAggregator = new BienIciAggregator_1.BienIciAggregator();
const seLogerAggregator = new SeLogerAggregator_1.SeLogerAggregator();
const papAggregator = new PapAggregator_1.PapAggregator();
const appartFilter = new AppartFilter_1.AppartFilter(["fourche"]);
const appartCache = new AppartCache_1.AppartCache([bienIciAggregator, papAggregator], [appartFilter]);
var customHeaderRequest = request.defaults({
    headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Cookie': 'SearchAnnDep=75; __uzma=mac59ec66f-75a6-441b-a383-45c4436b77f18839; __uzmb=1518028000; dtCookie=|U2VMb2dlcnww; bannerCookie=1; __uzmc=597031383007; __uzmd=1518028101; FirstVisitSeLoger=07/02/2018 18:28:21; AMCVS_366134FA53DB27860A490D44%40AdobeOrg=1; AMCV_366134FA53DB27860A490D44%40AdobeOrg=1099438348%7CMCIDTS%7C17570%7CMCMID%7C47437969625540765182758034982361188222%7CMCAAMLH-1518629264%7C6%7CMCAAMB-1518629264%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1518031664s%7CNONE%7CMCAID%7CNONE%7CMCSYNCSOP%7C411-17577%7CvVersion%7C2.1.0; __gads=ID=0f421b85026b304e:T=1518024506:S=ALNI_MY4RT0Qfpyr-3nRuKprS7z4X5OAjQ; visitId=98eb000a-fefc-4e4c-acd0-0e0cc70b78a6',
        'Host': 'www.seloger.com',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36',
    }
});
// Serve client files
app.use(express.static('../app'));
const server = app.listen(port, () => {
    console.log('AggregAppart is running at localhost:' + port);
});
const bodyParser = require('body-parser');
app.use(bodyParser.json());
// Set up Socket.IO to listen on port 8000
io.listen(server);
// Router
app.get("/api/", function (req, res) {
    res.status(200).send("Welcome to our restful API");
});
app.get("/api/apparts", (req, res) => __awaiter(this, void 0, void 0, function* () {
    let apparts = appartCache.GetApparts();
    res.status(200).send(apparts);
}));
app.get("/api/apparts/seloger", (req, res) => __awaiter(this, void 0, void 0, function* () {
    let apparts = yield seLogerAggregator.GetAppartments();
    res.status(200).send(apparts);
}));
app.get("/api/apparts/bienici", (req, res) => __awaiter(this, void 0, void 0, function* () {
    let apparts = yield bienIciAggregator.GetAppartments();
    res.status(200).send(apparts);
}));
app.get("/api/apparts/pap", (req, res) => __awaiter(this, void 0, void 0, function* () {
    let apparts = yield papAggregator.GetAppartments();
    res.status(200).send(apparts);
}));
