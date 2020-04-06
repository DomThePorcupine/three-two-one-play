const setup = (init = false) => {
    // First check if we are joining someone's video room
    const params = new SearchParams(window.location.search);
    if (params.get('session') !== null || init) {
        const wsconn = new WSConnection(params.get('session'));
        const videos = document.getElementsByTagName('video');

        if (videos.length !== 1) {
            return; // If there is more than 1 video that's weird. If there is no video, this is also weird.
        }

        const video = videos[0];

        if (init) {
            video.pause(); // If we are the first make sure it's paused
        }

        video.onpause = () => {
            console.log('requesting pause');
            wsconn.setPause();
        };

        video.onplay = () => {
            console.log('requesting play');
            wsconn.setPlay();
        };

        wsconn.onpause = () => {
            video.pause();

            const int = setInterval(() => {
                video.pause();
            }, 50);

            setTimeout(() => {
                clearInterval(int);
            }, 1000);
        };

        wsconn.onplay = () => {
            video.play();
        };

        wsconn.onRequestTime = () => {
            wsconn.setCurrentTime(video.currentTime);
        };

        wsconn.onSetTime = (nTime) => {
            console.log('setting time to: ', String(Math.round(nTime)));
            video.currentTime = String(Math.round(nTime));
        };
    } else {
        // Wait for user to init session
        console.log('no session given, waiting for user to init');
    }
};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    if (message.type === 'startNewSession') {
        setup(true);
    }
});

setTimeout(() => {
    setup(); // Try to setup
}, 3000);

