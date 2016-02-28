var amqp = require('amqplib/callback_api');

function get_positions(cb) {
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

                        cb(msg.content.toString());
                    }
                }, {noAck: true});

                ch.sendToQueue('hsl_positions',
                    new Buffer(''),
                    { correlationId: corr, replyTo: q.queue });
            });
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

http.createServer((req, res) => {
  get_positions(positions => {
      positions = JSON.parse(positions);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(JSON.stringify(positions));
  });
}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});