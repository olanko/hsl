var mqtt    = require('mqtt');
var hslclient  = mqtt.connect('mqtt://213.138.147.225:1883/');

var amqp = require('amqplib/callback_api')

amqp.connect('amqp://192.168.0.2', function(err, conn) {
    conn.createChannel(function(err, ch) {
        var ex = 'hsl_exchange';

        ch.assertExchange(ex, 'direct', {durable: false});

        hslclient.on('connect', function () {
            var subs = '/hfp/journey/tram/+/1009/#';

            hslclient.subscribe(subs, function(err, granted) {
                console.log('subscribed to %s, (%s)', granted[0].topic, granted[0].qos);
            });
        });
         
        hslclient.on('message', function (topic, message) {
            //glue topic to message
            message = JSON.parse(message);
            message.topic = topic;

            ch.publish(ex, 'vehicledata', new Buffer(JSON.stringify(message)));
        });
    });
});
