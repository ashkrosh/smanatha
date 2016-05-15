var SlackClient = require('@slack/client');
var RtmClient = SlackClient.RtmClient;
var CLIENT_EVENTS = SlackClient.CLIENT_EVENTS;
var RTM_EVENTS = SlackClient.RTM_EVENTS;
var MemoryDataStore = SlackClient.MemoryDataStore;

module.exports = plugin;

function plugin(opts){
  return function(robot){
    console.log(opts);

    var user = {id: null, name: null, nickname: null};
    var token = function(){
      if(opts['token']){
        return opts['token'];
      } else {
        console.log('Please define token in hermes.json');
        process.exit(1);
      }
    };

    var token = token();
    var rtm = new RtmClient(token, {
      logLevel: 'info', // check this out for more on logger: https://github.com/winstonjs/winston
      dataStore: new MemoryDataStore({}) // pass a new MemoryDataStore instance to cache information
    });

    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
      console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}`);
    });


    robot.connect = function(){
      var self = this;

      rtm.start();

      rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
        user.id = rtmStartData.self.id;
        user.name = rtmStartData.self.id;
      });

      rtm.on(RTM_EVENTS.MESSAGE, function(message){
        var mention = new RegExp("<@" + user.id + ">: ", 'ig');
        if(message.text.search(mention) > -1){
          message.text = message.text.replace(mention, '');
          self.emit('mention', message.text, message);
        } else {
          self.emit('message', message);
        }
      });
    };

    robot.say = function(msg, ctx){
      rtm.sendMessage(msg, ctx.channel, function(){
        console.log('Message sent');
      });
    };

    robot.replay = function(id, msg, ctx){
      var user = robot.user(id);
      var mention = robot.mention(user.nickname);
      msg = mention + ' ' + msg;
      robot.say(msg);
    };
  };
}
