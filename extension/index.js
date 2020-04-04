setTimeout(() => {
    // First check if we are joining someone's video room
    const params = new SearchParams(window.location.search);

    

    const videos = document.getElementsByTagName('video');

    if(videos.length !== 1) {
        return; // If there is more than 1 video that's weird. If there is no video, this is also weird.
    }

    const video = videos[0];

    const wsconn = new WSConnection(params.get('session'), video.currentTime);

    video.onpause = () => {
        wsconn.setPause();
    }

    video.onplay = () => {
        wsconn.setPlay();
    }

    wsconn.onpause = () => {
        video.pause();
    }

    wsconn.onplay = () => {
        video.play();
    }

    wsconn.onRequestTime = () => {
        wsconn.setCurrentTime(video.currentTime);
    }

    wsconn.onSetTime = (nTime) => {
        console.log('setting time to: ', String(Math.round(nTime)))
        video.currentTime = String(Math.round(nTime));
    }

    // First pause everything
    // video.pause();

    console.log(); // Grab the current time


}, 5000); // Wait 5 seconds then boot up