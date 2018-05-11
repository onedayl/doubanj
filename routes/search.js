#!/usr/bin/env node

const express = require('express');
const router = express.Router();
const superagent = require('superagent');

router.get('/', (req, res) => {
  const q = req.query.q ? req.query.q.trim() : '';
  if (q) {
    const url = encodeURI(`https://movie.douban.com/j/subject_suggest?q=${q}`);
    superagent
      .get(url)
      .end((err, reply) => {
        if (!err) {
          const movies = JSON.parse(reply.text).filter(e => {
            return e.type == 'movie';
          });
          res.end(JSON.stringify(movies));
        } else {
          res.end(JSON.stringify({
            code: 510,
            msg: '连接第三方服务器失败'
          }));
        }
      });
  } else {
    res.end(JSON.stringify({
      code: 205,
      msg: '查询关键词不能为空'
    }));
  }
});

module.exports = router;