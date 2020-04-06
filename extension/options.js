const startSession = () => {
    chrome.tabs.query({
        active: true,
        currentWindow: true,
    }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            type: 'startNewSession',
        }, (response) => {
            console.log(response);
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sButton').addEventListener('click', startSession);
});

