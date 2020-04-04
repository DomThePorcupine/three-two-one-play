// -- Third party imports -- //
const WebSocket = require('ws');
const UUID = require('uuid').v4;

const activeConnections = {}; // 

const getNewUUID = () => {
    let nuuid = UUID();
    while(activeConnections[nuuid] !== undefined) {
        nuuid = UUID(); // Try to get n ids until one doesn't exist
    }

    return nuuid;
}

const dispense = (sessionId, data) => {
    activeConnections[sessionId].clients.forEach((client) => {
        client.send(JSON.stringify(data));
    });
}

const server = new WebSocket.Server({
    host: '0.0.0.0',
    port: 5000,
});

server.on('connection', (socket) => {
    console.log('New websocket connection...');
    // socket.handShakeTimeout = setTimeout(() => {
    //     socket.close();
    // });

    socket.on('message', (message) => {
        console.log(message);
        try {
            const data = JSON.parse(message);
            // if(data.action === 'handshake') {
            //     clearTimeout(socket.handShakeTimeout); // Clear our timeout
            // }

            if(data.action === 'getSessionId') {
                console.log('Generating new session Id')
                const nSessionId = getNewUUID(); // Grab one
                socket.sessionId = nSessionId;
                socket.master = true;
                activeConnections[nSessionId] = {
                    clients: [socket]
                };
                socket.send(JSON.stringify({
                    action: 'setSessionId',
                    sessionId: nSessionId
                }))
                
            } else if(data.action === 'joinSession') {
                // Only join if session id is valid, otherwise close connection
                if(activeConnections[data.sessionId] !== undefined) {
                    activeConnections[data.sessionId].clients.push(socket);
                    socket.sessionId = data.sessionId;
                    console.log(activeConnections[socket.sessionId]);
                    // Force sync
                    activeConnections[socket.sessionId].clients.forEach((client) => {
                        if(client.master === true) {
                            client.send(JSON.stringify({
                                action: 'sync'
                            }));
                        }
                    })
                } else {
                    socket.close(); // Force close the socket connection
                }
            } else if(data.action === 'play') {
                // Lookup this session
                dispense(socket.sessionId, {action: 'play'});
            } else if(data.action === 'pause') {
                dispense(socket.sessionId, {action: 'pause'});
            } else if(data.action === 'setCurrentTime') {
                activeConnections[socket.sessionId].currentTime = data.currentTime;
                dispense(socket.sessionId, {action: 'setCurrentTime', currentTime: data.currentTime})
            } else if(data.action === 'sync') {
                // Look for the master
                activeConnections[socket.sessionId].clients.forEach((client) => {
                    if(client.master === true) {
                        client.send(JSON.stringify({
                            action: 'sync'
                        }));
                    }
                })
            }
        } catch (err) {
            console.log('There was an error parsing incoming message');
            console.log(err);
            console.log('---->', message);
        }
    })
})