var express = require('express'),
    app = express(),
    path = require('path'),
    cfenv = require("cfenv"),
    appEnv = cfenv.getAppEnv();

var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.PORT || 3000);

app.set('port', port);
app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'), function() {
  console.log('Server started at ' + host + ":" + port);
});
