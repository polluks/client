var browserApp = require('./browser/app');
process.on('error', function(err) {
  console.log(err)
}
browserApp.run('file://' + __dirname + '/index.html');
