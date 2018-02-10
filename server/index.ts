import * as express from 'express';
import * as request from 'request';
import * as http from 'http';
import * as socketio from 'socket.io';
import { AppartCache } from './services/AppartCache';
import { BienIciAggregator }  from './services/BienIciAggregator';
import { SeLogerAggregator } from './services/SeLogerAggregator';
import { PapAggregator } from './services/PapAggregator';
import { AppartKeywordsFilter } from './services/AppartKeywordsFilter';
import { AppartIdsFilter } from './services/AppartIdsFilter';

require('source-map-support').install(); // For .js.map's
process.on('unhandledRejection', console.log); // Better logging in promises
process.setMaxListeners(0); // Mem leak erros

const app = express();
const instance = http.createServer(app);
const io = socketio(instance);

const port = process.env['PORT'] || 3000;

const bienIciAggregator = new BienIciAggregator();
const seLogerAggregator = new SeLogerAggregator();
const papAggregator = new PapAggregator();
const appartKeywordsFilter = new AppartKeywordsFilter(["fourche"]);
const appartIdsFilter = new AppartIdsFilter(["orpi-1-00604802SDZF"]);

const appartCache = new AppartCache([bienIciAggregator, seLogerAggregator, papAggregator], [appartKeywordsFilter, appartIdsFilter]);
    
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
app.get("/api/", function(req, res) {
    res.status(200).send("Welcome to our restful API");
});

app.get("/api/apparts", async (req, res) => {
    let apparts = appartCache.GetApparts();
    res.status(200).send(apparts);
});

app.get("/api/apparts/seloger", async (req, res) => {
    let apparts = await seLogerAggregator.GetAppartments()
    res.status(200).send(apparts);
});

app.get("/api/apparts/bienici", async (req, res) => {
    let apparts = await bienIciAggregator.GetAppartments();
    res.status(200).send(apparts);
});

app.get("/api/apparts/pap", async (req, res) => {
    let apparts = await papAggregator.GetAppartments()
    res.status(200).send(apparts);
});

app.post("/api/apparts/filter-id/:id", (req, res) => {
    var id: string = req.params.id;
    var value: boolean = req.body.value;
    appartIdsFilter.Set(id, value);
    res.status(200).send();
});
