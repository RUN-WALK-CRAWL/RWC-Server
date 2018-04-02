'use strict';

//MIDDLEWARE VARIABLES
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');
const bp = require('body-parser');

//API KEYS
const ZOMATO_KEY = process.env.ZOMATO_KEY;
// const GOOGLE_KEY = process.env.GOOGLE_KEY;

//APPLICATION SETUP
const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

//DATABASE SETUP
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/search', (req, res) => {
  console.log('Routing an ajax request for ', req.params);
  let url = `https://developers.zomato.com/api/v2.1/search?count=${req.query.count}lat=${req.query.lat}&lon=${req.query.lon}&radius=${req.query.radius}&establishment_type=283&category=11&sort=real_distance&order=asc`;
  superagent.get(url)
    .set('user_key', ZOMATO_KEY)
    .then(console.log(res));
});

//LISTEN
app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));