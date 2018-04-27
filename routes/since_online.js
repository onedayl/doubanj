#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const router = express.Router();

const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;

router.get('/', function(req, res) {
  const since = req.query.since
    ? validateSince(req.query.since)
    : Math.floor(Date.now() / 1000);

  MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
    if (!err) {
      const cursor = db.collection('newOnline')
      .find({"insert_time": {$lt: since}})
      .sort({"_id": -1});

      
      cursor.next((err, doc) => {
        if(!err && doc != null) {
          const sinceDate = new Date(doc.insert_time * 1000);
          const y = sinceDate.getFullYear();
          let m = sinceDate.getMonth();
          const d = sinceDate.getDate();
          const startTime = Math.floor(new Date(`${y}, ${m + 1}, ${d}`).getTime() / 1000);
          const endTime = Math.floor(new Date(`${y}, ${m + 1}, ${d + 1}`).getTime() / 1000);

          db.collection('newOnline')
            .find({"insert_time": {$gte: startTime, $lt: endTime}})
            .sort({"_id": -1})
            .toArray((err, docs) => {
              if (!err) {
                m = m < 9 ? `0${m + 1}` : m + 1;
                const data = {
                  date: `${y}-${m}-${d}`,
                  movies: docs
                }
                res.send(JSON.stringify({
                  code: 200,
                  msg: 'OK',
                  data: data
                }));
                db.close();
              }
            })
        } else {
          res.send(JSON.stringify({
            code: 200,
            msg: 'OK',
            data: {}
          }));
          db.close();
        }
      });
    } else {
      res.send(JSON.stringify({
        code: 500,
        msg: 'Connect to database fails.'
      }));
    }
  });

  function validateSince(since) {
    if (/\d{10}/.test(since)) {
      return parseInt(since);

    } else if (/\d{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[01])/.test(since)) {
      return Math.floor(new Date(since).getTime() / 1000) + 86400;

    } else {
      return Math.floor(Date.now() / 1000);
    }
  }
});

module.exports = router;
