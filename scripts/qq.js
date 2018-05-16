#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const cheerio = require('cheerio');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;
const url = 'https://v.qq.com/x/list/movie?offset=0&format=1&sort=19';

const QQ = {
  fetch: function (callback) {
    MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
      if (!err) {

            superagent
              .get(url)
              .end((err, reply) => {
                if (!err) {
                  const $ = cheerio.load(reply.text);
                  const items = Array.from($('.list_item .figure'));
                  const hitDocs = items.map(e => {
                    return {
                      id: e.attribs['data-float'],
                      title: e.children[1].attribs.alt
                    }
                  });
                  if (hitDocs.length !== 0) {
                    const newDocs = hitDocs.map(e => {
                      return {
                        id: e.id,
                        title: e.title,
                        source_id: 1,
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

module.exports = QQ;