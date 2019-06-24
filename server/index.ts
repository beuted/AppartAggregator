import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import { AppartCache } from './services/AppartCache';
import { BienIciAggregator }  from './services/BienIciAggregator';
import { SeLogerAggregator } from './services/SeLogerAggregator';
import { PapAggregator } from './services/PapAggregator';
import { AppartKeywordsFilter } from './services/AppartKeywordsFilter';
import { AppartIdsFilter } from './services/AppartIdsFilter';
import { ConfigService } from './services/ConfigService';
import * as storage from 'node-persist';

require('source-map-support').install(); // For .js.map's
process.on('unhandledRejection', console.error); // Better logging in promises
process.setMaxListeners(0); // Mem leak erros

Init();

async function Init() {
    const app = express();
    http.createServer(app);

    const port = process.env['PORT'] || 3000;

    await storage.init({
        dir : './persist',
        stringify: JSON.stringify,
        parse: JSON.parse,
        encoding: 'utf8',
        logging: false,  // can also be custom logging function
        ttl: false, // ttl* [NEW], can be true for 24h default or a number in MILLISECONDS or a valid Javascript Date object
    });

    let configService = new ConfigService();
    const bienIciAggregator = new BienIciAggregator(configService);
    const seLogerAggregator = new SeLogerAggregator(configService);
    const papAggregator = new PapAggregator(configService);

    const appartKeywordsFilter = new AppartKeywordsFilter(["fourche"]);
    await appartKeywordsFilter.InitFromStorage();

    const appartIdsFilter = new AppartIdsFilter(["orpi-1-00604802SDZF"]);
    await appartIdsFilter.InitFromStorage();

    const appartCache = new AppartCache([bienIciAggregator, seLogerAggregator, papAggregator], [appartKeywordsFilter, appartIdsFilter]);
    await appartCache.Start();

    // Serve client files
    app.use(express.static('../app/dist'));
    const server = app.listen(port, () => {
        console.log('AggregAppart is running at localhost:' + port);
    });

    const bodyParser = require('body-parser');
    app.use(bodyParser.json());

    // Router
    app.get("/api/", function(req, res) {
        res.status(200).send("Welcome to our restful API");
    });

    app.get("/api/apparts", async (req, res) => {
        const apparts = appartCache.GetAppartsFiltered();
        res.status(200).send(apparts);
    });

    app.get("/api/apparts/seloger", async (req, res) => {
        const apparts = await seLogerAggregator.GetAppartments();
        res.status(200).send(apparts);
    });

    app.get("/api/apparts/bienici", async (req, res) => {
        const apparts = await bienIciAggregator.GetAppartments();
        res.status(200).send(apparts);
    });

    app.get("/api/apparts/pap", async (req, res) => {
        const apparts = await papAggregator.GetAppartments();
        res.status(200).send(apparts);
    });

    app.post("/api/apparts/filter-id/:id", (req, res) => {
        // Since id comes of uriComponentDecoded (but it should not) we have to url encode it.
        const id: string = encodeURIComponent(req.params.id);
        const value: boolean = req.body.value;
        appartIdsFilter.Set(id, value);
        res.status(200).send();
    });

    app.delete("/api/apparts/filter-id/all", async (req, res) => {
        appartIdsFilter.Reset();
        res.status(200).send();
    });

    app.post("/api/apparts/starred/:id", (req, res) => {
        // Since id comes of uriComponentDecoded (but it should not) we have to url encode it.
        const id: string = encodeURIComponent(req.params.id);
        const value: boolean = req.body.value;
        appartCache.SetStarredAppart(id, value);
        res.status(200).send();
    });

    app.post("/api/apparts/:id/notes", (req, res) => {
        // Since id comes of uriComponentDecoded (but it should not) we have to url encode it.
        const id: string = encodeURIComponent(req.params.id);
        const value: string = req.body.value;
        appartCache.SetAppartNotes(id, value);
        res.status(200).send();
    });

    app.get("/api/apparts/starred", (req, res) => {
        const starredApparts = appartCache.GetStarredApparts();
        res.status(200).send(starredApparts);
    });

    app.get("/api/apparts/config", async (req, res) => {
        const config = await configService.GetConfig();
        res.status(200).send(config);
    });

    app.post("/api/apparts/config/excluded-keyword", async (req, res) => {
        const config = await appartKeywordsFilter.Set(req.body.keyword, req.body.excluded);
        res.status(200).send(config);
    });

    app.post("/api/apparts/config/search-urls", async (req, res) => {
        const config = await configService.SetSearchUrls(req.body);
        res.status(200).send(config);
    });
}