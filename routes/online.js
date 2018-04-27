#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const router = express.Router();

const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;

router.get('/', function(req, res, next) {
  const start = req.query.start ? validateStart(req.query.start) : 0;

  MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
    if (!err) {
      console.log('hehe');
      const cursor = db.collection('newOnline')
      .find()
      .sort({"_id": -1})
      .skip(start)
      .limit(10)
      
      cursor.toArray((err, docs) => {
        if (!err) {
          res.send(JSON.stringify({
            code: 200,
            msg: 'OK',
            data: docs
          }));
          db.close();
        } else {
          res.send(JSON.stringify({
            code: 500,
            msg: 'Database query fails.'
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

  function validateStart(start) {
    const _start = parseInt(start);
    return isNaN(_start) ? 0 : _start;
  }
});

module.exports = router;
