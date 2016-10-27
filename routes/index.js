'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db/index.js')


module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT tweets.id AS id, name, content FROM tweets INNER JOIN users ON users.id = tweets.userid', function (err, result) {
    if (err) return next(err); // pass errors to Express
    var tweets = result.rows;
    res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
   });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query('SELECT * FROM users INNER JOIN tweets ON users.id = tweets.userid WHERE name=$1', [req.params.username], function (err, result){
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true, username: req.params.username, showRetweet: true});
    }); 
    // var tweetsForName = tweetBank.find({ name: req.params.username });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsForName,
    //   showForm: true,
    //   username: req.params.username
    // });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    client.query('SELECT id, content FROM tweets WHERE id = $1', [req.params.id], function (err, result){
      if (err) return next(err);
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true, showDelete: true });
    }); 
    // var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsWithThatId // an array of only one element ;-)
    // });
  });

  router.get('/tag/:tag', function(req,res,next){
    var tag = req.params.tag;
    client.query('SELECT * FROM tweets INNER JOIN users ON users.id = tweets.userid WHERE content LIKE $1', ["%\#"+tag+"%"], function (err, result){
      if (err) return next(err);
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    }); 
  }); 

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    client.query('SELECT * FROM users WHERE name = $1', [req.body.name], function (err, result){
      if(result.rows.length === 0) {
        client.query('INSERT INTO users (name) VALUES ($1)', [req.body.name], function (err, result){
            if (err) return next(err);
        });
      }
      client.query('SELECT * FROM users WHERE name = $1', [req.body.name], function (err, result){
        if (err) return next(err);
        var user_id = result.rows[0].id;
        client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [user_id, req.body.content], function (err, result){
              if (err) return next(err);
        });
      });
    });
   res.redirect('/');
   });

  router.post('/retweet', function(req, res, next){
    client.query('SELECT * FROM users WHERE name = $1', [req.body.name], function (err, result){
      if(result.rows.length === 0) {
        client.query('INSERT INTO users (name) VALUES ($1)', [req.body.name], function (err, result){
            if (err) return next(err);
        });
      }
      client.query('SELECT * FROM users WHERE name = $1', [req.body.name], function (err, result){
        if (err) return next(err);
        var user_id = result.rows[0].id;
        client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [user_id, req.body.content], function (err, result){
              if (err) return next(err);
        });
      });
    });
    res.redirect('/');
   });



   router.post('/tweets/delete/', function(req, res, next){
    client.query('DELETE FROM tweets WHERE id = $1' ,[req.body.delete], function(err, result) {
      if (err) return next(err);
    })
    res.redirect('/');
   })
    
    // var newTweet = tweetBank.add(req.body.name, req.body.content);
    // io.sockets.emit('new_tweet', newTweet);
    // res.redirect('/');
  


  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}



