#!/bin/sh

echo ">>>>>>>> BUILDING FRONT";
cd ./app/;
npm install;
npm run build;
echo ">>>>>>>> BUILDING SERVER";
cd ../server/;
npm install;
npm run build;
echo ">>>>>>>> STARTING APP";
PORT=3005 forever start index.js;
