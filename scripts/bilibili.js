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
        const cursor = db.collection('newOnlineSource')
          .find({source_id: 8})
          .sort({_id: -1})
          .limit(1);

        cursor.next((err, doc) => {
          if (!err) {
            const latestId = doc ? doc.id : '';
            superagent
              .get(url)
              .end((err, reply) => {
                if (!err) {
                  const hitDocs = JSON.parse(reply.text).result.data
                    .filter(e => {
                      return !(/（中文）/.test(e.title));
                    });
                  let newDocs = [];
                  if (latestId == '') {
                    newDocs = hitDocs;
                  } else {
                    for (let i = 0; i < hitDocs.length; i++) {
                      const e = hitDocs[i];
                      if (e.season_id != latestId) {
                        newDocs.push(e);
                      } else {
                        break;
                      }
                    }
                  }
                  if (newDocs.length !== 0) {
                    newDocs = newDocs.map(e => {
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
          } else {
            db.close();
          }
        });
      }
    });
  }
}

module.exports = BILIBILI;