import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import { BienIciAggregator }  from './services/BienIciAggregator';
import { SeLogerAggregator } from './services/SeLogerAggregator';
import { AppartFilter } from './services/AppartFilter';

const app = express();
const instance = http.createServer(app);
const io = socketio(instance);

const port = process.env['PORT'] || 3000;

const bienIciAggregator = new BienIciAggregator();
const seLogerAggregator = new SeLogerAggregator();
const appartFilter = new AppartFilter(["fourche"]);

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
    let appartsBI = await bienIciAggregator.GetAppartments();
    let appartsSL = await seLogerAggregator.GetAppartments();
    let apparts = appartsBI.concat(appartsSL);
    let filteredApparts = appartFilter.Filter(apparts);
    res.status(200).send(filteredApparts);
});

app.get("/api/seloger", async (req, res) => {
    let apparts = await seLogerAggregator.GetAppartments();
    res.status(200).send(apparts);
});

app.get("/api/bienici", async (req, res) => {
    let apparts = await bienIciAggregator.GetAppartments();
    res.status(200).send(apparts);
});
