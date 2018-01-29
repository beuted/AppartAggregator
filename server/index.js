const express = require('express');
const app = express();
const instance = require('http').createServer(app);
const io = require('socket.io')(instance);
const BienIciAggregator = require('./services/BienIciAggregator');
const SeLogerAggregator = require('./services/SeLogerAggregator')
const AppartFilter = require('./services/AppartFilter');

const port = process.env.PORT || 3000;

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

app.get("/api/apparts", async function(req, res) {
    let appartsBI = await bienIciAggregator.GetAppartments();
    let appartsSL = await seLogerAggregator.GetAppartments();
    let apparts = appartsBI.concat(appartsSL);
    let filteredApparts = appartFilter.Filter(apparts);
    res.status(200).send(filteredApparts);
});

app.get("/api/seloger", async function(req, res) {
    let apparts = await seLogerAggregator.GetAppartments();
    res.status(200).send(apparts);
});

app.get("/api/bienici", async function(req, res) {
    let apparts = await bienIciAggregator.GetAppartments();
    res.status(200).send(apparts);
});
