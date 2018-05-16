#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;
const url = 'https://bangumi.bilibili.com/media/web_api/search/result?area=-1&style_id=-1&year=-1&season_status=-1&order=0&st=2&sort=0&page=1&season_type=2&pagesize=20';

const BILIBILI = {
  fetch: callback => {
    MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
      if (!err) {
        superagent
          .get(url)
          .end((err, reply) => {
            if (!err) {
              const hitDocs = JSON.parse(reply.text).result.data
                .filter(e => {
                  return !(/（中文）/.test(e.title));
                });
              if (hitDocs.length !== 0) {
                const newDocs = hitDocs.map(e => {
                  return {
                    id: e.season_id,
                    title: e.title,
                    source_id: 8,
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

module.exports = BILIBILI;