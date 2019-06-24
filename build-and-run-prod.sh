#!/bin/sh

cd ./app/;
npm install;
npm run build;
cd ../server/;
npm install;
npm run build;
PORT=3005 forever start index.js;
