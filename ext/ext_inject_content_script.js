// ext_inject_content_script
// a script run in the popup that will inject a content_script into the active tab

(async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true, url: "*://nebuilder.neb.com/*"})
    if (typeof tab !== 'undefined') {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['cs_nebuilder.js'],
            })
        } catch (ex) {
            console.error(`failed to execute script: ${ex}`)
        }
    }
})()



// chrome.action is the icon for the extension
// so this method is fired when you click the icon
// on click, we inject the cs_<script>. it will connect to the neb_tools port and report everything it needs to
// this gets removed if you have a default_popup
//chrome.action.onClicked.addListener((tab) => {
//    chrome.scripting.executeScript({
//        target: {tabId: tab.id},
//        files: ["content-script.js"]
//    });
//});

