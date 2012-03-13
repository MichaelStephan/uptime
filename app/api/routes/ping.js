/**
 * Module dependencies.
 */

var Check      = require('../../../models/check');
var CheckEvent = require('../../../models/checkEvent');
var Ping       = require('../../../models/ping');

/**
 * Check Routes
 */
module.exports = function(app) {
  
  app.get('/pings/check/:id/:page?', function(req, res) {
    Check.count({ _id: req.params.id}, function(err, nb_checks) {
      if (err) return app.next(err);
      if (!nb_checks) return app.next(new Error('failed to load check ' + req.params.id));
      Ping.find({ check: req.params.id }).desc('timestamp').limit(50).skip((req.params.page -1) * 50).run(function(err, pings) {
        if (err) return next(err);
        res.json(pings);
      });
    });
  });

  app.get('/pings/events', function(req, res) {
    CheckEvent.find({ timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} }).desc('timestamp').populate('check').run(function(err, events) {
      if (err) return next(err);
      res.json(CheckEvent.aggregateEventsByDay(events));
    });
  });

  app.post('/ping', function(req, res) {
    Check.findById(req.body.checkId, function(err1, check) {
      if (err1) {
        return res.send(err1.message, 500);
      };
      if (!check.needsPoll) {
        return res.send('Error: This check was already polled. No ping was created', 403);
      };
      var status = req.body.status === 'true';
      Ping.createForCheck(status, req.body.time, check, req.body.name, req.body.error, function(err2, ping) {
        if (err2) {
          return res.send(err2.message, 500);
        }
        res.json(ping);
      });
    })
  });

};