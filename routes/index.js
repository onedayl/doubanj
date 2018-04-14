#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const index = express.Router();

const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;

index.get('/', function(req, res, next) {
  const SINCE = req.query.since ? req.query.since : new Date().getTime();
  const FORMAT = req.query.format ? req.query.format : '';

  MongoClient.connect(MONGODB_HOST, (err, client) => {
    if (!err) {
      const db = client.db(MONGODB_NAME);
      const cursor = db.collection('newOnline')
      .find({"insert_time": {$lt: SINCE}})
      .sort({"_id": -1});
      
      cursor.next((err, doc) => {
        if(!err && doc != null) {
          const sinceDate = new Date(doc.insert_time);
          const y = sinceDate.getFullYear();
          const m = sinceDate.getMonth();
          const d = sinceDate.getDate();
          const startTime = new Date(`${y}, ${m + 1}, ${d}`).getTime();
          const endTime = new Date(`${y}, ${m + 1}, ${d + 1}`).getTime();

          db.collection('newOnline')
            .find({"insert_time": {$gte: startTime, $lt: endTime}})
            .sort({"_id": -1})
            .toArray((err, docs) => {
              if (!err) {
                const data = {
                  date: `${y}-${m + 1}-${d}`,
                  movies: docs
                }

                if (FORMAT == 'json') {
                  res.send(JSON.stringify({
                    code: 200,
                    msg: 'OK',
                    data: data
                  }));
                } else {
                  res.render('index', data);
                }
                client.close();
              }
            })
        } else if (FORMAT == 'json') {
          res.send(JSON.stringify({
            code: 200,
            msg: 'OK',
            data: []
          }));
          client.close();
        } else {
          res.render('index');
          client.close();
        }
      });
    } else {
      res.render('index');
      client.close();
    }
  });
});

module.exports = index;
