var express = require('express');
var app = express();

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});

app.use('/assets', express.static('assets'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/assets/index.html');
});


var io = require('socket.io')(server);
var slaveSocket;

io.on('connection', function (socket) {
    console.log('Socket ID:', socket.id);
    socket.on('SLAVE_AUTH', function(data) {
        // 记录从端的socket id，后续的控制指令均向此id推送
        slaveSocket = socket;
    });

  socket.on('MASTER_COMMAND', function (data) {
    if (slaveSocket != null) {
        console.log('Send to slave socket:', slaveSocket.id, data);
        slaveSocket.emit('FORWARD_MASTER_COMMAND', data);
    }
  });
});
