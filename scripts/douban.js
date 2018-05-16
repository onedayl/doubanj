#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;
const url = 'https://movie.douban.com/j/new_search_subjects?sort=R&range=0,10&playable=1&start=0';

const DOUBAN = {
  fetch: callback => {
    MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
      if (!err) {
        superagent
          .get(url)
          .end((err, reply) => {
            if (!err) {
              const hitDocs = JSON.parse(reply.text).data;
              if (hitDocs.length !== 0) {
                const newDocs = hitDocs.map(e => {
                  return {
                    id: e.id,
                    title: e.title,
                    source_id: 0,
                    douban_id: e.id
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

module.exports = DOUBAN;