#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var args = process.argv.slice(2);

// if (args.length == 0) {
//     console.log("Usage: positions.js");
//     process.exit(1);
// }

amqp.connect('amqp://192.168.0.2', function(err, conn) {
    conn.createChannel(function(err, ch) {
        ch.assertQueue('', {exclusive: true}, function(err, q) {
            var corr = generateUuid();
            //var vehid = args[0];

            console.log(' [x] Requesting positions(%d)');

            ch.consume(q.queue, function(msg) {
                if (msg.properties.correlationId == corr) {
                    console.log(' [.] Got %s', msg.content.toString());
                    conn.close();
                    process.exit(0); 
                    //setTimeout(function() { conn.close(); process.exit(0); }, 500);
                }
            }, {noAck: true});

            ch.sendToQueue('hsl_positions',
                new Buffer(''),
                { correlationId: corr, replyTo: q.queue });
        });
    });
});

function generateUuid() {
    return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}