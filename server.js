// -- Third party imports -- //
const WebSocket = require('ws');
const uuid = require('uuid').v4;

const PORT = process.env.PORT || 5000;

const activeConnections = {}; //

const getNewUUID = () => {
    let nuuid = uuid();
    while (activeConnections[nuuid] !== undefined) {
        nuuid = uuid(); // Try to get n ids until one doesn't exist
    }

    return nuuid;
};

const dispense = (sessionId, data) => {
    activeConnections[sessionId].clients.forEach((client) => {
        client.send(JSON.stringify(data));
    });
};

const askForSync = (sessionId) => {
    activeConnections[sessionId].clients.forEach((client) => {
        if (client.master === true) {
            client.send(JSON.stringify({
                action: 'sync',
            }));
        }
    });
};

const server = new WebSocket.Server({
    host: '0.0.0.0',
    port: PORT,
});

server.on('connection', (socket) => {
    console.log('New websocket connection...');

    socket.on('message', (message) => {
        console.log(message);
        try {
            const data = JSON.parse(message);

            if (data.action === 'getSessionId') {
                console.log('Generating new session Id');
                const nSessionId = getNewUUID(); // Grab one
                socket.sessionId = nSessionId;
                socket.master = true;
                activeConnections[nSessionId] = {
                    clients: [socket],
                    state: 'pause',
                    stateChangeBy: null,
                };
                socket.send(JSON.stringify({
                    action: 'setSessionId',
                    sessionId: nSessionId,
                }));
            } else if (data.action === 'joinSession') {
                // Only join if session id is valid, otherwise close connection
                if (activeConnections[data.sessionId] !== undefined) {
                    activeConnections[data.sessionId].clients.push(socket);
                    socket.sessionId = data.sessionId;
                    // Ask for a sync
                    askForSync(socket.sessionId);
                } else {
                    socket.close(); // Force close the socket connection
                }
            } else if (data.action === 'play') {
                // Lookup this session
                if (activeConnections[socket.sessionId].state !== 'play') {
                    // Needs to be the same person that started / stopped
                    // or a new person
                    if (activeConnections[socket.sessionId].stateChangeBy === socket || activeConnections[socket.sessionId].stateChangeBy === null) {
                        activeConnections[socket.sessionId].state = 'play'; // Lock right away
                        dispense(socket.sessionId, { action: 'play' });
                        if (activeConnections[socket.sessionId].stateChangeBy !== null) {
                            activeConnections[socket.sessionId].stateChangeBy = null; // reset
                        } else {
                            activeConnections[socket.sessionId].stateChangeBy = socket; // set to requester
                        }
                    } else {
                        console.log(activeConnections[socket.sessionId].stateChangeBy);
                        console.log('wrong user tried to play');
                    }
                } else {
                    console.log('Already playing, will ignore.');
                }
            } else if (data.action === 'pause') {
                if (activeConnections[socket.sessionId].state !== 'pause') {
                    if (activeConnections[socket.sessionId].stateChangeBy === socket || activeConnections[socket.sessionId].stateChangeBy === null) {
                        activeConnections[socket.sessionId].state = 'pause'; // Lock right away
                        dispense(socket.sessionId, { action: 'pause' });
                        // We have transitioned from playing to paused, so request sync
                        askForSync(socket.sessionId);
                        if (activeConnections[socket.sessionId].stateChangeBy !== null) {
                            activeConnections[socket.sessionId].stateChangeBy = null; // reset
                        } else {
                            activeConnections[socket.sessionId].stateChangeBy = socket; // set to requester
                        }
                    } else {
                        console.log(activeConnections[socket.sessionId].stateChangeBy);
                        console.log('wrong person tried to pause');
                    }
                } else {
                    console.log('Already paused, will ignore.');
                }
            } else if (data.action === 'setCurrentTime') {
                // We have asked for a sync, and the client has responded
                activeConnections[socket.sessionId].currentTime = data.currentTime;
                dispense(socket.sessionId, { action: 'setCurrentTime', currentTime: data.currentTime });
                // Also dispense the current state
                dispense(socket.sessionId, { action: activeConnections[socket.sessionId].state });
            } else if (data.action === 'ping') { // To keep connection alive with heroku
                socket.send(JSON.stringify({
                    action: 'pong',
                }));
            }
        } catch (err) {
            console.log('There was an error parsing incoming message');
            console.log(err);
            console.log('---->', message);
        }
    });

    socket.on('close', () => {
        // Remove ourselves from the client list
        try {
            activeConnections[socket.sessionId].clients = activeConnections[socket.sessionId].clients.filter((c) => {
                return c !== socket;
            });

            if (activeConnections[socket.sessionId].length === 0) {
                delete activeConnections[socket.sessionId]; // Delete from our list of active connections
            }
        } catch (err) {
            console.log(err);
        }
    });
});
