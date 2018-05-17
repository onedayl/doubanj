#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;

module.exports = function (docs) {
  MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
    if (!err) {
      console.log('newOnlineSource: ' + docs[0].source_id);
      let n = docs.length - 1;
      let newDocs = [];
      checkNewOnlineSource();

      function checkNewOnlineSource () {
        if (n >= 0) {
          const doc = docs[n];
          const cursor = db.collection('newOnlineSource')
            .find({id: doc.id, source_id: doc.source_id})
            .limit(1);
          cursor.count((err, num) => {
            if (!err && num === 0) {
              console.log('new: ' + doc.title);
              newDocs.push(doc);
              n -= 1;
              checkNewOnlineSource();
            } else {
              console.log('old: ' + doc.title);
              n -= 1;
              checkNewOnlineSource();
            }
          });
        } else if (!newDocs.length) {
          console.log('newOnlineSource skip.');
        } else {
          db.collection('newOnlineSource').insertMany(newDocs.reverse(), err => {
            if (!err) {
              console.log('newOnlinceSource good.');
            } else {
              console.log('newOnlinceSource bad.');
            }
          });
          let i = newDocs.length - 1;
          let matches = [];
          matchNewOnline();
          
          function matchNewOnline () {
            if (i >=0) {
              const doc = newDocs[i];
              if (doc.douban_id) {
                matches.push(doc);
                i -= 1;
                matchNewOnline();
              } else {
                const url = encodeURI(`https://movie.douban.com/j/subject_suggest?q=${doc.title}`);
                superagent
                  .get(url)
                  .end((err, reply) => {
                    if (!err) {
                      const data = JSON.parse(reply.text);
                      if (data && data[0] && data[0].title == doc.title) {
                        doc.douban_id = data[0].id;
                        matches.push(doc)
                        i -= 1;
                        matchNewOnline();
                      } else {
                        i -= 1;
                        matchNewOnline();
                      }
                    } else {
                      i -= 1;
                      matchNewOnline();
                    }
                  });
              }
            } else {
              let j = matches.length - 1;
              const checked = [];
              checkNewOnline();
    
              function checkNewOnline() {
                if (j >= 0) {
                  const doc = matches[j];
                  doc.douban_id = doc.douban_id.toString();
                  const cursor = db.collection('newOnline')
                    .find({id: doc.douban_id})
                    .limit(1);
                  cursor.count((err, num) => {
                    if (!err && num === 0) {
                      checked.push(doc);
                      j -= 1;
                      checkNewOnline();
                    } else {
                      j -= 1;
                      checkNewOnline();
                    }
                  });
                } else {
                  const packed = [];
                  let k = checked.length - 1;
                  packNewOnline();
    
                  function packNewOnline () {
                    if (k >= 0) {
                      const doc = checked[k];
                      const url = `http://dbj.onedayl.com/movie/subject/${doc.douban_id}`;
                      superagent
                        .get(url)
                        .end((err, reply) => {
                          if (!err) {
                            const data = JSON.parse(reply.text).data;
                            // 过滤掉豆瓣上还未更新播放源信息或未有评分的条目
                            if (data.play_source.length !== 0 && data.rating) {
                              packed.push({
                                id: doc.douban_id,
                                title: data.title,
                                cover: data.cover,
                                rating: data.rating,
                                insert_time: Math.floor(Date.now() / 1000)
                              });
                            } 
                            k -= 1;
                            packNewOnline();
                          } else {
                            k -= 1;
                            packNewOnline();
                          }
                        });
                    } else if (packed.length) {
                      db.collection('newOnline')
                        .insertMany(packed.reverse(), err => {
                          if (!err) {
                            console.log('insert newOnline successed!');
                          }
                          db.close();
                        });
                    } else {
                      db.close();
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
}