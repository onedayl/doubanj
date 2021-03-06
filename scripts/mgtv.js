#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;
const url = 'https://pianku.api.mgtv.com/rider/list/msite?abroad=0&_support=10000000&fstlvlId=3&ic=3&pn=1&pc=30&kind=a4&area=a3&chargeInfo=a1&edition=2835073&sort=c1';

const MGTV = {
  fetch: function (callback) {
    MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
      if (!err) {
        superagent
          .get(url)
          .end((err, reply) => {
            if (!err) {
              const hitDocs = JSON.parse(reply.text).data.hitDocs
                .filter(e => {
                  return e.rightCorner.text != '预告';
                });
              if (hitDocs.length !== 0) {
                const newDocs = hitDocs.map(e => {
                  return {
                    id: e.clipId,
                    title: e.title,
                    source_id: 4,
                    douban_id: ''
                  }
                });
                db.close();
                callback(newDocs);
              } else {
                db.close();
            } 
          } else {
            db.close();
          }   
        }) 
      }
    })
  }        
}

module.exports = MGTV;
