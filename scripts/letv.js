#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const cheerio = require('cheerio');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;
const url = 'http://rec.letv.com/pcw?cid=1&action=more&num=10&area=rec_0011&region=zh_cn&versiontype=IntelligentOperation&disable_record_exposure=1&type=1|ars|02024|video&lc=c55e413c977f856e0c12e4c2563bda6a&pt=0001&uid=&_=1526441514150';

const LETV = {
  fetch: function (callback) {
    MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
      if (!err) {
        superagent
          .get(url)
          .end((err, reply) => {
            if (!err) {
              const data = JSON.parse(reply.text).rec;
              const hitDocs = data.map(e => {
                return {
                  id: e.vid,
                  title: e.title
                }
              });
              if (hitDocs.length !== 0) {
                const newDocs = hitDocs.map(e => {
                  return {
                    id: e.id,
                    title: e.title,
                    source_id: 6,
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
    });
  }
}

module.exports = LETV;