var _ = require('lodash');

var mqtt    = require('mqtt');
var hslclient  = mqtt.connect('mqtt://213.138.147.225:1883/');

var amqp = require('amqplib/callback_api');

var default_channel = '/hfp/journey/tram/#';
var channels = {};
var wait_until_unsubscribe = 10 * 1000;

var channel_active = function(channel) {
    channel.last_active = Date.now();

    setTimeout(hsl_check_channel_activity, 2000);
};

var hsl_check_channel_activity = function() {
    if (!_.size(channels)) {
        return;
    }

    _.forEach(channels, function(v, k) {
        if (v.last_active + wait_until_unsubscribe < Date.now()) {
            hsl_unsubsribe(v.name);
        }
        console.log(v.last_active + wait_until_unsubscribe, Date.now());
        console.log(v, k);
    });

    setTimeout(hsl_check_channel_activity, 2000);
};

var hsl_subscribe = function(subs) {
    if (!subs || subs === "*") {
        subs = default_channel;
    }

    if (!channels[subs]) {
        hslclient.subscribe(subs, function(err, granted) {
            console.log('subscribed to %s, (%s)', granted[0].topic, granted[0].qos);
            channels[subs] = { name: subs };
            channel_active(channels[subs]);
        });
    } else {
        channel_active(channels[subs]);
    }

};
var hsl_unsubsribe = function(subs) {
    hslclient.unsubscribe(subs, function(err, resp) {
        delete channels[subs];
        console.log('unsubscribe %s', subs);
    });
};

amqp.connect('amqp://192.168.0.2', function(err, conn) {
    conn.createChannel(function(err, ch) {
        var ex = 'hsl_exchange';

        ch.assertExchange(ex, 'direct', {durable: false});

        hslclient.on('connect', function () {
            hsl_subscribe();
        });
         
        hslclient.on('message', function (topic, message) {
            //glue topic to message
            message = JSON.parse(message);
            message.topic = topic;

            ch.publish(ex, 'vehicledata', new Buffer(JSON.stringify(message)));
        });
    });

    /* request subsription */
    conn.createChannel(function(err, ch) {
        var q = 'hsl_request_channel';

        ch.assertQueue(q, {durable: false});
        console.log(' [hsl_request_channel] Awaiting requests');
        ch.consume(q, function reply(msg) {
            console.log(msg.content);
            hsl_subscribe('*');
            ch.ack(msg);
        });
    });
});
