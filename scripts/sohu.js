#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const cheerio = require('cheerio');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;
const url = 'http://so.tv.sohu.com/list_p1100_p2_p3_p4_p5_p6_p73_p8_p91_p10_p11_p12_p13.html';

const SOHU = {
  fetch: function (callback) {
    MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
      if (!err) {
        superagent
          .get(url)
          .end((err, reply) => {
            if (!err) {
              const $ = cheerio.load(reply.text);
              const items = Array.from($('.lh-tit a'));
              const hitDocs = items.map(e => {
                return {
                  id: /\/(\d+)\.html/.exec(e.attribs.href)[1],
                  title: e.attribs.title
                }
              });
              if (hitDocs.length !== 0) {
                const newDocs = hitDocs.map(e => {
                  return {
                    id: e.id,
                    title: e.title,
                    source_id: 5,
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

module.exports = SOHU;