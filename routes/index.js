#!/usr/bin/env node

const express = require('express');
const path = require('path');
const superagent = require('superagent');
const router = express.Router();

router.get('/', (req, res) => {
  const url = `${req.headers.host}/movie/online`;
  superagent
    .get(url)
    .timeout({
      response: 5000,
      deadline: 60000
    })
    .end((err, ret) => {
      if (!err) {
        res.render('index', JSON.parse(ret.text));
      }
    })
});

module.exports = router;
