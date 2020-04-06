/**
 * A wrapper class for websocket operations
 */
class WSConnection {
    /**
     * Default constructor
     *
     * @param {string} sessionId - The id pulled from the url
     */
    constructor (sessionId) {
        this.serverURL = 'wss://three-two-one-play.herokuapp.com';
        // this.serverURL = 'ws://localhost:5000';
        this.sessionId = sessionId;
        this.server = null;
        this.state = null;
        this.connect();
    }

    /**
     * A connection wrapper - makes for easy reconnect on failure
     */
    connect () {
        this.server = new WebSocket(this.serverURL);

        this.server.onopen = () => {
            console.log('connection established');
            if (this.sessionId === null) {
                this.server.send(JSON.stringify({
                    action: 'getSessionId',
                }));
            } else {
                this.server.send(JSON.stringify({
                    action: 'joinSession',
                    sessionId: this.sessionId,
                }));
            }

            // Need to ping server to keep connection alive
            setInterval(() => {

            });
        };

        this.server.onmessage = (message) => {
            try { // try to parse our incoming message
                const data = JSON.parse(message.data);
                console.log(data);
                if (data.action === 'play') {
                    this.state = 'play';
                    // Play the video
                    this.onplay();
                } else if (data.action === 'pause') {
                    this.state = 'pause';
                    // Pause the video
                    this.onpause();
                } else if (data.action === 'setSessionId') {
                    // Popup ?
                    alert(`${window.location.href }?session=${ data.sessionId}`);
                } else if (data.action === 'sync') {
                    this.onRequestTime();
                } else if (data.action === 'setCurrentTime') {
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
        };

        this.server.onclose = () => {
            console.log('Websocket connection has been closed.');
            this.server = null; // Hopefully delete everything
            setTimeout(() => {
                this.connect();
            }, 3000); // Try to reconnect in 3 seconds
        };

        setInterval(() => {
            this.sendMessage({
                action: 'ping',
            });
        }, 15000); // Do this every 15 seconds
    }

    /**
     * Send a json object to the ws server
     *
     * @param {object} jsonPayload - The payload to stringify
     */
    sendMessage (jsonPayload) {
        if (this.server !== null) {
            if (this.server.readyState === WebSocket.OPEN) {
                this.server.send(JSON.stringify(jsonPayload));
            }
        }
    }

    /**
     * A wrapper for sending the current time
     *
     * @param {number} currentTime - The current time of the video tag
     */
    setCurrentTime (currentTime) {
        this.sendMessage({
            action: 'setCurrentTime',
            currentTime,
        });
    }

    /**
     * A wrapper for sending the play action
     */
    setPlay () {
        this.sendMessage({
            action: 'play',
        });
    }


    /**
     * A wrapper for sending the pause action
     */
    setPause () {
        this.sendMessage({
            action: 'pause',
        });
    }

    onpause () {
        // Should be overwritten
    }

    onplay () {
        // Should be overwritten
    }

    onRequestTime () {
        // Should be overwritten
    }

    onSetTime (nTime) {
        // SHould be overwritten
    }
}
