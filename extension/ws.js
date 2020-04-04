class WSConnection {
    constructor(sessionId) {
        // this.serverURL = window.location.host === 'wwww.disneyplus.com' ? 'wss://donttouchurface.doms.land:5000' : 'ws://localhost:5000';
        this.serverURL = 'ws://localhost:5000';
        this.sessionId = sessionId;
        this.server = null;
        this.connect();
    }

    connect() {
        this.server = new WebSocket(this.serverURL);

        this.server.onopen = () => {
            console.log('connection established');
            if(this.sessionId === null) {
                this.server.send(JSON.stringify({
                    action: 'getSessionId'
                }));
            } else {
                this.server.send(JSON.stringify({
                    action: 'joinSession',
                    sessionId: this.sessionId,
                }))
            }
        };

        this.server.onmessage = (message) => {
            try { // try to parse our incoming message
                const data = JSON.parse(message.data);
                console.log(data);
                if(data.action === 'play') {
                    // Play the video
                    this.onplay();
                } else if(data.action === 'pause') {
                    // Pause the video
                    this.onpause();
                } else if (data.action === 'setSessionId') {
                    // Popup ?
                    alert(window.location.href + '?session=' + data.sessionId);
                } else if(data.action === 'sync') {
                    this.onRequestTime();
                } else if(data.action === 'setCurrentTime') {
                    this.onSetTime(data.currentTime);
                } else {
                    // Dunno
                }
            } catch (err) {
                console.log('Error parsing incoming info');
                console.log(err);
            }
            
        };

        this.server.onerror = (err) => {
            console.log('There was an error with the websocket connection');
            console.log(err);
            this.server.close(); // Force a close & reconnect
        }

        this.server.onclose = () => {
            console.log('Websocket connection has been closed.');
            this.server = null; // Hopefully delete everything
            setTimeout(() => {
                this.connect();
            }, 3000); // Try to reconnect in 3 seconds
        }
    }

    setCurrentTime(currentTime) {
        if(this.server !== null) {
            if(this.server.readyState === WebSocket.OPEN) {
                this.server.send(JSON.stringify({
                    action: 'setCurrentTime',
                    currentTime
                }));
            }
        }
    }

    setPlay() {
        if(this.server !== null) {
            if(this.server.readyState === WebSocket.OPEN) {
                this.server.send(JSON.stringify({
                    action: 'play',
                }));
            }
        }
    }

    setPause() {
        if(this.server !== null) {
            if(this.server.readyState === WebSocket.OPEN) {
                this.server.send(JSON.stringify({
                    action: 'pause',
                }));
            }
        }

        setTimeout(() => {
            if(this.server !== null) {
                if(this.server.readyState === WebSocket.OPEN) {
                    this.server.send(JSON.stringify({
                        action: 'sync',
                    }));
                }
            }
        }, 500);
    }

    onpause() {
        // Should be overwritten
    }

    onplay() {
        // Should be overwritten
    }

    onRequestTime() {
        // Should be overwritten
    }

    onSetTime(nTime) {
        // SHould be overwritten
    }
}