# Aggregator d'appart

Fait en moins de 24h à fond les ballons le code est hardcore

* `> npm install -g tsc`
* `> tsc` in the server folder
* `> node index.js`
* Go to http://localhost:3000

## TODO:

* SeLoger + BienIci : gerer la pagination
* Ajouter Pap et LBC
* update du front via polling ou socket.io
* Envoyer plus de requests en parallele
* Mettre du caching sur SeLoger (On choppe la liste des Ids, si ya pas de nouvelles annonces pas besoin de requery tout)
* BONUS: Placer les apparts sur une carte
