#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;

const FetchOnline = function() {
  MongoClient.connect(`${MONGODB_HOST}/${MONGODB_NAME}`, (err, db) => {
    if (!err) {
      // 获取第一页 20 条数据
      const onlineUrl = 'https://movie.douban.com/j/new_search_subjects';
      superagent
        .get(onlineUrl)
        .timeout({
          response: 5000,
          deadline: 60000
        })
        .query({
          sort: 'R',
          range: '0,10',
          playable: '1',
          tags: '',
          start: 0
        })
        .end((err, reply) => {
          if (!err) {
            const data = JSON.parse(reply.text).data;
            if (data) {
              const onlineArrival = data.map(e => {
                return {
                  id: e.id,
                  title: e.title,
                  cover: e.cover,
                  rating: e.rate
                }
              });

              let i = onlineArrival.length - 1;
              insertMovie();

              function insertMovie () {
                const movie = onlineArrival[i];
                const cursor = db.collection('newOnline').find({id: movie.id});
                
                cursor.count((err, n) => {
                  if (n === 0) {
                    movie.insert_time = Math.floor(Date.now() / 1000);
                    db.collection('newOnline').insertOne(movie, err => {
                      if (i > 0) {
                        i -= 1;
                        insertMovie();
                      } else {
                        db.close();
                      }
                    })
                  } else if (i > 0){
                    i -= 1;
                    insertMovie();
                  } else {
                    db.close();
                  }
                })
              }
            } else {
              db.close();
            }            
          } else {
            db.close();
          }
        });
    }
  });
}

module.exports = FetchOnline;