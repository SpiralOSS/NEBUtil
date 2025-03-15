// ext_neb_tools.js
// script run in the extension that connects to the service_worker and generates a table based on what is
// sent to us

// WIPE THE MAIN VIEW
var mainView = document.getElementById("main")

function clearView() {
    mainView.innerHTML = ""
}

function createTableScrapeItem(itemName, dataPayload) {
    // TITLE
    let span_Title = document.createElement("span")
    span_Title.innerText = itemName

    // COPY BUTTON
    let button_Copy = document.createElement("button");
    button_Copy.classList.add("btn");
    button_Copy.classList.add("btn-sm");
    button_Copy.textContent = "Copy!"
    button_Copy.onclick = function () {
        navigator.clipboard.writeText(dataPayload)
    }

    let td_Title = document.createElement("td");
    td_Title.classList.add("text-nowrap");
    td_Title.appendChild(span_Title);

    let td_CopyButton = document.createElement("td");
    td_CopyButton.appendChild(button_Copy);

    let tr = document.createElement("tr");
    tr.appendChild(td_Title);
    tr.appendChild(td_CopyButton);

    return tr
}
function scrapeTableToString(tableName, tableData) {
    // tableData: { header: [ string, .. ]; rows: [ [ string, .. ], .. ]
    if (tableName === "Component Fragments") {
        let produdcedByIndex = tableData.header.indexOf("Produced by");
        return tableData.rows
            .sort((a, b) => a[produdcedByIndex].localeCompare(b[produdcedByIndex]))
            .map(row => row.join("\t"))
            .join("\n")
    } else if (tableName === "Required Oligonucleotides") {
        return tableData.rows
            .map(row => row.join("\t"))
            .join("\n")
    }
}

// NE BUILDER PORT
nebuilder_port = chrome.runtime.connect({name: "neb_tools_ext"})
nebuilder_port.onMessage.addListener((message, _) => {


})
