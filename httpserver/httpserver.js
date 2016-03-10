var amqp = require('amqplib/callback_api');
var _ = require('lodash');

function create_conn(cb) {
  amqp.connect('amqp://192.168.0.2', function(err, conn) {
    cb(conn);
  });
}

function get_positions(conn, cb) {
    var trams = {};
        conn.createChannel(function(err, ch) {
            ch.assertQueue('', {exclusive: true}, function(err, q) {
                var corr = generateUuid();

                ch.consume(q.queue, function(msg) {
                    if (msg.properties.correlationId == corr) {

                        //console.log('reload at ' + Date.now());

                        msg = JSON.parse(msg.content);
                        trams = _(msg).map(function(t) {
                          return {
                            lat: t.VP.lat,
                            lng: t.VP.long,
                            message: t.VP.veh,
                            hdg: t.VP.hdg,
                            spd: t.VP.spd,
                            dl: t.VP.dl
                          };
                        }).keyBy('message').value();

                        //setTimeout(function() {
                          ch.close();
                        //}, 1000);
                        cb(trams);
                    }
                }, {noAck: true});

                ch.sendToQueue('hsl_positions',
                    new Buffer(''),
                    { correlationId: corr, replyTo: q.queue });
            });
        });
}

function generateUuid() {
    return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}

const http = require('http');

const hostname = '127.0.0.1';
const port = 5005;

create_conn(function(conn) {
  http.createServer((req, res) => {
    get_positions(conn, positions => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(positions));
    });
  }).listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
});