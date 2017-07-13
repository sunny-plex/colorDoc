var express = require('express');
var app = express();

console.log('starting host on 127.0.0.1 ...');

app.get('/\**/', function(req, res) {
    var fileName = req.params[0] || 'viewer.html';
    var options = {
        root: __dirname,
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    console.log((new Date).toTimeString().split(' ')[0] + ' ' +fileName);
    res.sendFile(fileName, options);
    res.end;
})

app.listen(1166, function() {
    console.log('express web server started on "http://127.0.0.1:1166/"');
});
