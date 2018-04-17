#!/usr/bin/env node

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const assert = require('assert');
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_NAME = process.env.MONGODB_NAME;

let FetchOnline = function() {
  MongoClient.connect(MONGODB_HOST, (err, client) => {
    const db = client.db(MONGODB_NAME);
    assert.equal(err, null, 'Connect to database fails!');
    
    // 获取数据库中最新影片的 id
    const cursor = db.collection('newOnline').find().sort({_id: -1});
    
    cursor.next((err, doc) => {
      assert.equal(err, null, 'Query database fails!');
      
      const newOnlineURL = 'https://movie.douban.com/j/new_search_subjects';
      const latestID = doc ? doc.id : 0;
      const startLimit = 60;
      let start = 0;
      let newOnlineArrival = [];
      let isFinished = false;
  
      fetchNewOnline();
      
      function fetchNewOnline() {
        superagent
        .get(newOnlineURL)
        .timeout({
          response: 5000,
          deadline: 60000
        })
        .query({
          sort: 'R',
          range: '0,10',
          playable: '1',
          tags: '',
          start: start
        })
        .end((err, res) => {
          if (!err) {
            let data = JSON.parse(res.text).data;
            if (data) {
              if (latestID === 0) {
                // 没有记录时只获取一批
                newOnlineArrival = data.map(e => {
                  return {
                    id: e.id,
                    title: e.title,
                    cover: e.cover,
                    rating: e.rate
                  }
                });
                isFinished = true;
                
              } else {
                // 有记录时一直到匹配 latestID 为止
                // 设定一个上限房应对特殊情况
                // 比如 latestID 的影片刚好被和谐了
                for (let i = 0; i < data.length; i++) {
                  const el = data[i];
                  if (el.id == latestID) {
                    isFinished = true;
                    break;
                    
                  } else {
                    newOnlineArrival.push({
                      id: el.id,
                      title: el.title,
                      cover: el.cover,
                      rating: el.rate
                    })
                  }
                }
              }
              
              if (!isFinished && start < startLimit - 20) {
                start += 20;
                fetchNewOnline();
    
              } else if (newOnlineArrival.length !== 0){
                let i = newOnlineArrival.length - 1;
                insertMovie();

                function insertMovie () {
                  let movie = newOnlineArrival[i];
                  let cursor = db.collection('newOnline').find({id: movie.id});
                  cursor.count((err, n) => {
                    if (n === 0) {
                      movie.insert_time = Math.floor(Date.now() / 1000);
                      db.collection('newOnline').insertOne(movie, err => {
                        if (i > 0) {
                          i -= 1;
                          insertMovie();
                        } else {
                          client.close();
                        }
                      })
                    } else if (i > 0){
                      i -= 1;
                      insertMovie();
                    } else {
                      client.close();
                    }
                  })
                }
              }
            } else {
              client.close();
            }
          } else {
            client.close();
          }
        })
      }
    })
  });
}

module.exports = FetchOnline;