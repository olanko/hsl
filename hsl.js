var mqtt    = require('mqtt');
var hslclient  = mqtt.connect('mqtt://213.138.147.225:1883/');

var amqp = require('amqplib/callback_api')

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        var q = 'hsl_queue';

        ch.assertQueue(q, {durable: false});

        hslclient.on('connect', function () {
          hslclient.subscribe('/hfp/journey/tram/+/1009/#');
        });
         
        hslclient.on('message', function (topic, message) {
            ch.sendToQueue(q, new Buffer(message), {persistent: false});
        });
    });
});
