// chrome.runtime is this, the service worker
// this is listening to connections from the content script and extension

var port_ext = undefined
var port_cs = undefined

chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "neb_tools_ext") {
        port_ext = port  // Extension port; this will be assigned first

    } else if (port.name === "neb_tools_cs") {
        port_cs = port  // Content Script port; port_ext will receive messages from it

        // Setup unidirectional communication between content script (in the browser) and extension
        port_cs.onMessage.addListener(msg => {
            port_ext.postMessage(msg)
        })
        port_ext.onMessage.addListener(msg => {
            port_cs.postMessage(msg)
        })
    }
})

chrome.runtime.onSuspend.addListener(function (suspend) {
    port_ext = undefined
    port_cs = undefined
})