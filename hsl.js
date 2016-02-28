var mqtt    = require('mqtt');
var client  = mqtt.connect('mqtt://213.138.147.225:1883/');
 
client.on('connect', function () {
  client.subscribe('/hfp/journey/tram/+/1009/#');
});
 
client.on('message', function (topic, message) {
  // message is Buffer 
  message = JSON.parse(message);
  var spd = message.VP.spd;
  console.log(message);
});
