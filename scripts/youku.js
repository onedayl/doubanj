#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const cheerio = require('cheerio');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;
const url = 'http://list.youku.com/category/show/c_96_s_6_d_1_u_1.html';

const YOUKU = {
  fetch: function (callback) {
    MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
      if (!err) {
        superagent
          .get(url)
          .end((err, reply) => {
            if (!err) {
              const $ = cheerio.load(reply.text);
              const items = Array.from($('.info-list .title a'));
              const hitDocs = items.map(e => {
                return {
                  id: /id_((\w|\d)+)=?=?/.exec(e.attribs.href)[1],
                  title: e.attribs.title
                }
              });
              if (hitDocs.length !== 0) {
                const newDocs = hitDocs.map(e => {
                  return {
                    id: e.id,
                    title: e.title,
                    source_id: 2,
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

module.exports = YOUKU;