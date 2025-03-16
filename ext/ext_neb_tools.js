// ext_neb_tools.js
// script run in the extension that connects to the service_worker and generates a table based on what is
// sent to us

function clearView() {

    document.getElementById("viewNebButton").classList.remove("hidden");
    document.getElementById("viewCompFrag").classList.add("hidden")
    document.getElementById("viewRequOlig").classList.add("hidden")
}

function scrapeTableToString(tableData) {
    //  { name: "...", type: "scrape_table",
    //    data: { header: [col1, col2, ...], rows: [ [ val11, val12 ], ... ] }
    //  },
    if (tableData.name === "Component Fragments") {
        let producedByIndex = tableData.data.header.indexOf("Produced by");
        return tableData.data.rows
            .sort((a, b) => a[producedByIndex].localeCompare(b[producedByIndex]))
            .map(row => row.join("\t"))
            .join("\n")
    } else if (tableData.name === "Required Oligonucleotides") {
        return tableData.data.rows
            .map(row => row.join("\t"))
            .join("\n")
    }
}

// NE BUILDER PORT
nebuilder_port = chrome.runtime.connect({name: "neb_tools_ext"})
nebuilder_port.onMessage.addListener((message, _) => {
    let hideNebButton = false
    clearView()

    let compFrags = message.cs_data.find(data => data.name === "Component Fragments")
    if (compFrags !== undefined) {
        let tableAsString = scrapeTableToString(compFrags)
        document.getElementById("btnCopyCompFrag").onclick = function()
        {
            navigator.clipboard.writeText(tableAsString)
        }
        document.getElementById("viewCompFrag").classList.remove("hidden")
        hideNebButton = true
    }

    let requOlig = message.cs_data.find(data => data.name === "Required Oligonucleotides")
    if (requOlig !== undefined) {
        let tableAsString = scrapeTableToString(requOlig)
        document.getElementById("btnCopyRequOlig").onclick = function () {
            navigator.clipboard.writeText(tableAsString)
        }
        document.getElementById("viewRequOlig").classList.remove("hidden")
        hideNebButton = true
    }

    if (hideNebButton) {
        document.getElementById("viewNebButton").classList.add("hidden");
    }
})


document.getElementById('nebButton').onclick = () => {
    chrome.tabs.create({url: 'https://nebuilder.neb.com'})
}

clearView()
