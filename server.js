'use strict';

//MIDDLEWARE VARIABLES
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');
const bp = require('body-parser');

//API KEYS
const ZOMATO_KEY = process.env.ZOMATO_KEY;

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

app.get('/api/v1/rwc/:username', (req, res) => {
  client.query(`SELECT password, id, username FROM users WHERE username='${req.params.username}';`)
    .then(result => {
      if(result.rows[0].password ==req.headers.token){
        let validate={
          name:result.rows[0].username,
          token:true,
          id:result.rows[0].id
        };
        res.send(validate);
      }
    })
    .catch(console.error);
});

app.post('/api/v1/register', (req, res) => {
  let {username, token} = req.body;
  client.query(`INSERT INTO users(username, password) VALUES($1, $2)`,
    [username, token]
  )
    .then(res.send(true))
    .catch(console.error);
});

app.get('/api/v1/crawls/:id', (req, res) => {
  console.log(req.params.id);
  client.query(`
    SELECT users.username, crawls.user_id, crawls.route_id, crawls.route_name, crawls.longitude, crawls.latitude, crawls.price, crawls.stops
    FROM crawls
    INNER JOIN users ON users.id=crawls.user_id
    WHERE users.id=$1;`, [req.params.id])
    .then(results => {
      res.send(results.rows);})
    .catch(console.error);
});

app.post('/api/v1/crawls/:id/:routeName', (req, res) => {
  let {lat, lng, price, stops} = req.body;
  client.query(`INSERT INTO crawls(latitude, longitude, price, stops, user_id, route_name) VALUES($1,$2,$3,$4,$5,$6);`,
    [lat, lng, price, stops, req.params.id, req.params.routeName]

  )
    .then(res.send('Saved!'))
    .catch(console.error);
});

app.get('/search/:lat/:lng/:stops/:price', (req, res) => {
  let url = `https://developers.zomato.com/api/v2.1/search`;
  const combinedResults = {};
  superagent.get(url)
    .set({'user-key': ZOMATO_KEY})
    .query({
      count: '20',
      lat: req.params.lat,
      lon: req.params.lng,
      radius: 100,
      establishment_type: '6',
      sort: 'real_distance',
      order: 'asc'})
    .then(
      pubs => {combinedResults.pub = pubs.text;
        superagent.get(url)
          .set({'user-key': ZOMATO_KEY})
          .query({
            count: '20',
            lat: req.params.lat,
            lon: req.params.lng,
            radius: 100,
            establishment_type: '7',
            sort: 'real_distance',
            order: 'asc'})
          .then( bars => {
            combinedResults.bar = bars.text;
            res.send(combinedResults);});
      })
    .catch(err => console.log(err));
});

//LISTEN
app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));