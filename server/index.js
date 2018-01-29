var express = require('express');
var app = express();
var instance = require('http').createServer(app);
var io = require('socket.io')(instance);
var BienIciAggregator = require('./services/BienIciAggregator');
var AppartFilter = require('./services/AppartFilter');

var port = process.env.PORT || 3000;

var bienIciAggregator = new BienIciAggregator();
var appartFilter = new AppartFilter(["fourche"]);

// Serve client files
app.use(express.static('public'));
var server = app.listen(port, () => {
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
    var apparts = await bienIciAggregator.GetAppartments();
    var filteredApparts = appartFilter.Filter(apparts);
    res.status(200).send(filteredApparts);
});
