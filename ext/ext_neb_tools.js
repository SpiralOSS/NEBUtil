// ext_neb_tools.js
// script run in the extension that connects to the service_worker and generates a table based on what is
// sent to us

class Request {
    constructor(type, data) {
        this.type = type
        this.data = data
    }
}

function hideViews(subviews = "") {
    let viewEls = []
    if (subviews === "") {
        viewEls = document.querySelectorAll('[id^="view"]');
    } else {
        viewEls = document.querySelectorAll('[id^="view_' + subviews + '_"]');
    }
    viewEls.forEach(el => el.classList.add('hidden'))
}

function showView(viewName) {
    document.getElementById("view_" + viewName).classList.remove("hidden")
}

function clearView() {
    hideViews()
    showView('nebButton')
}

function scrapeTableToString(tableData) {
    if (tableData.name === "Component Fragments") {
        let producedByIndex = tableData.header.indexOf("Produced by");
        return tableData.rows
            .sort((a, b) => a[producedByIndex].localeCompare(b[producedByIndex]))
            .map(row => row.join("\t"))
            .join("\n")
    } else if (tableData.name === "Required Oligonucleotides") {
        return tableData.rows
            .map(row => row.join("\t"))
            .join("\n")
    }
}

// NE BUILDER PORT
nebuilder_port = chrome.runtime.connect({name: "neb_tools_ext"})
nebuilder_port.onMessage.addListener((response, _) => {
    console.log(response)

    // COMPONENT FRAGMENTS
    if (response.type === ResponseType.TABLE_COMPONENT_FRAGMENT) {
        let tableAsString = scrapeTableToString(response.data)
        document.getElementById("btnCopyCompFrag").onclick = () => navigator.clipboard.writeText(tableAsString)
        showView('compFrag')
    }

    // REQUIRED OLIGONUCLEOTIDES
    if (response.type === ResponseType.TABLE_REQUIRED_OLIG) {
        let tableAsString = scrapeTableToString(response.data)
        document.getElementById("btnCopyRequOlig").onclick = () => navigator.clipboard.writeText(tableAsString)
        showView('requOlig')
    }

    // PCR ISSUES
    if (response.type === ResponseType.PCR_OUTSIDE_DESIRED_RANGE) {
        hideViews('pcr')

        let pcrIssueNames = response.data  // an array of names
        if (pcrIssueNames.length > 1) {
            showView('pcr_multipleBuildIssue')  // we only can handle one

        } else if (pcrIssueNames.length === 1) {
            let pcrIssueName = pcrIssueNames[0]

            // set the name of the fragment with the issue
            Array.from(document.getElementsByClassName("pcrName")).forEach(el => el.innerText = `Primer ${pcrIssueName} Outside Range!`)

            // set the button to request the existing ranges
            document.getElementById('btnGetPrimerRegions').onclick =
                () => nebuilder_port.postMessage(new Request(RequestType.PCR_START_RANGES, pcrIssueName))

            showView('pcr_buildIssue')
        }
    }

    if (response.type === ResponseType.PCR_START_RANGES) {
        hideViews('pcr')
    }
})

document.getElementById('nebButton').onclick = () => {
    chrome.tabs.create({url: 'https://nebuilder.neb.com'})
}

clearView()
