var CronJob = require('cron').CronJob;
var Redis = require('ioredis');
const client = process.env.DOCKER
  ? new Redis({
      host: 'redis',
      port: 6379,
    })
  : new Redis();
const logger = require('./logger');

module.exports = {
  startDeleter: function () {
    try {
      var job = new CronJob(
        '00 00 00 13 * *',
        function () {
          var stream = client.scanStream({
            match: 'trusted_ips_*',
          });
          stream.on('data', function (keys) {
            // `keys` is an array of strings representing key names
            if (keys.length) {
              var pipeline = client.pipeline();
              keys.forEach(function (key) {
                pipeline.del(key);
              });
              pipeline.exec();
            }
          });
          stream.on('end', function () {
            logger.info('Flushed all trusted IPs');
          });
        },
        null,
        true,
        'Canada/Eastern'
      );
      job.start();
    } catch (error) {
      console.error(error);
    }
  },
};
