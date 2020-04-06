const WebSocket = require('ws');

const ws = new WebSocket('wss://three-two-one-play.herokuapp.com');
ws.on('open', () => {
    console.log('open');
})