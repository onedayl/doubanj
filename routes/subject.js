#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const router = express.Router();
const superagent = require('superagent');
const redis = require('redis');
const redisClient = redis.createClient({url : process.env.REDIS_URI});
const cheerio = require('cheerio');
const playSourceName = [
  '腾讯视频',
  '优酷视频',
  '爱奇艺视频',
  '芒果 TV',
  '搜狐视频',
  '乐视视频',
  'PP视频',
  '哔哩哔哩'
];
const playSourceSearchSuffix = [
  'https://v.qq.com/x/search/?q=',
  'http://www.soku.com/search_video/q_',
  'http://so.iqiyi.com/so/q_',
  'https://so.mgtv.com/so/k-',
  'https://so.tv.sohu.com/mts?box=1&wd=',
  'http://so.le.com/s?wd=',
  'http://search.pptv.com/s_video?kw=',
  'https://search.bilibili.com/all?keyword='
];

router.get('/:id', (req, res, next) => {
  res.set({ 'content-type': 'application/json; charset=utf-8' });
  const id = validateId(req.params.id);
  if (id == '0') {
    next();

  } else {
    redisClient.get(`subject:${id}`, (err, reply) => {
      if (!err) {
        if (reply) {
          // redis 有缓存时直接返回
          res.end(reply);          

        } else {
          // 抓取页面信息写入 redis 并返回
          const subjectUrl = `https://movie.douban.com/subject/${id}/`;
          superagent
          .get(subjectUrl)
          .set({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36'
          })
          .end((err, reply) => {
            if (!err) {
              const $ = cheerio.load(reply.text);
              const data = extractSubject($);
              data.url = subjectUrl;
              const subject = JSON.stringify({
                code: 200,
                msg: "OK",
                data: data
              });

              redisClient.set(`subject:${id}`, subject, 'EX', 86400);
              res.end(subject);
            } 
          });
        }
      } else {
        res.end(JSON.stringify({
          code: 510,
          msg: '连接缓存服务器失败'
        }))
      }
    })
  }


  
});

router.use('/', (req, res) => {
  res.end(JSON.stringify({
    code: 205,
    msg: 'id 缺失或无效'
  }));
});

function validateId(id) {
  let _id = parseInt(id);
  _id = isNaN(_id) ? '0' : _id.toString();
  _id = /^\d{7,8}$/.test(_id) ? _id : '0';
  return _id;
}

function extractSubject($) {
  const subject = {};

  subject.title = /(.+)\s\(豆瓣\)/.exec($('title').text().trim())[1];
  subject.year = /\((\d+)\)/.exec($('.year').text())[1];

  const director = $('a[rel="v:directedBy"]');
  if (director.length == 1) {
    subject.director = director.text();
  } else {
    subject.director = Array.from(director)
      .map(e => e.children[0].data)
      .join('/');
  }

  const genre = $('span[property="v:genre"]');
  if (genre.length == 1) {
    subject.genre = genre.text(); 
  } else if (genre.length > 1) {
    subject.genre = Array.from(genre)
      .map(e => e.children[0].data)
      .join('/');
  }

  const runtime = $('span[property="v:runtime"]');
  if (runtime.length == 1) {
    subject.runtime = runtime.text();
  } else if (runtime.length > 1){
    subject.runtime = Array.from(runtime)
      .map(e => e.children[0].data)
      .join('/');
  }

  subject.cover = $('img[rel="v:image"]').prop('src');
  subject.rating = $('strong[property="v:average"]').text();
  subject.summary = $('span[property="v:summary"]').text();
  
  const play_source = [];
  const playBtn = $('a.playBtn');
  if (playBtn.length !== 0 ) {
    subject.free_play = false;
    Array.from(playBtn).forEach((e, i) => {
      play_source[i] = {};
      play_source[i].id = playSourceName.indexOf(e.attribs['data-cn']);
      play_source[i].link = e.attribs.href == 'javascript: void 0;'
        ? playSourceSearchSuffix[play_source[i].id] + subject.title
        : e.attribs.href;
    });

    const buyLink = $('.buylink-price span');
    Array.from(buyLink).forEach((e, i) => {
      play_source[i].price = e.children[0].data.trim();
      if (!subject.free_play && /^免费$/.test(play_source[i].price)) {
        subject.free_play = true;
      }
    });
  }
  subject.play_source = play_source;
  return subject;
}

module.exports = router;