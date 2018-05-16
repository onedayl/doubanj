#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;
const url = 'http://search.video.iqiyi.com/o?pageNum=1&mode=4&ctgName=%E7%94%B5%E5%BD%B1&threeCategory=%E9%99%A2%E7%BA%BF&pageSize=20&type=list&if=html5&pos=1&site=iqiyi&qyid=j8rlsb12x6hhevwx7uk8ajvz&access_play_control_platform=15&pu=&u=j8rlsb12x6hhevwx7uk8ajvz&ispurchase=&_=1526181464412';

const IQIYI = {
  fetch: function (callback) {
    MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
      if (!err) {
        superagent
          .get(url)
          .end((err, reply) => {
            if (!err) {
              const hitDocs = JSON.parse(reply.text).data.docinfos
                .filter(e => {
                  return !(/（普通话）/.test(e.albumDocInfo.albumTitle));
                });
              if (hitDocs.length !== 0) {
                const newDocs = hitDocs.map(e => {
                  return {
                    id: e.albumDocInfo.albumId,
                    title: e.albumDocInfo.albumTitle,
                    source_id: 3,
                    douban_id: e.albumDocInfo.video_lib_meta.douban_id || ''
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

module.exports = IQIYI;