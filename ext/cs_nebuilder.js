// cs_nebuilder.js
// content script

function isDefined(obj) {
    return typeof(obj) !== 'undefined'
}

if (!isDefined(Message)) {
    var ScrapeTable = class {
        header = []
        rows = []
        constructor(name) {
            this.name = name
        }
    }

    var PcrIssues = class {
        constructor(names) {
            this.names = names
        }
    }

    var Message = class {
        constructor(type, data) {
            this.type = type
            this.data = data
        }
    }

    // From ContentScript to Extension
    var ResponseType = {
        TABLE_COMPONENT_FRAGMENT: 0,
        TABLE_REQUIRED_OLIG: 1,
        PCR_OUTSIDE_DESIRED_RANGE: 2,
        PCR_START_RANGES: 3,
    }

    // From Extension to ContentScript
    var RequestType = {
        PCR_START_RANGES: 0,
    }
}
function memberExists(member) {
    let notExists = false
    notExists = notExists || member === null
    notExists = notExists || !isDefined(member)
    return !notExists
}

function hasClassName(elem, className) {
    try {
        return isDefined(elem.classList) && elem.classList.contains(className)
    } catch {
        return false
    }
}

function findTableByName(tableName) {
    try {
        let tableHeadersElem = Array.from(document.getElementsByTagName("h5"))
        let tableHeaderElem = tableHeadersElem.find(t => t.innerText === tableName)
        return tableHeaderElem.parentElement.parentElement.getElementsByTagName("table")[0]
    } catch {
        return undefined
    }
}

function readTableHeader(tableElem) {
    let headerElems = Array.from(tableElem.getElementsByTagName("th"))
    return headerElems.map(headerElem => headerElem.innerText)
}

function readTableRows(tableElem, readTableCellFunc) {
    let rowElems = Array.from(tableElem.getElementsByTagName("tr")).slice(1)  // skip the first row; which will be the header
    return rowElems.map(rowElem => Array.from(rowElem.getElementsByTagName("td")).map(readTableCellFunc))
}

function readTableCell(tableDataElem) {
    return Array.from(tableDataElem.childNodes)
        .filter(tableCellNode => !memberExists(tableCellNode.nodeValue) || tableCellNode.nodeValue.trim() !== '')
        .filter(tableCellNode => !hasClassName(tableCellNode, "mlabel"))
        //.filter(tableCellNode => !hasClassName(tableCellNode, "spacer"))
        .map(td => {
            if (isDefined(td.innerText)) {
                return td.innerText
            } else if (isDefined(td.data)) {
                return td.data.toString()
            }
        })
        .map(text => text.replace('"', '').trim())
        .join("")
}

function scrapeTable(tableName, readTableCellFunc) {
    try {
        let table = findTableByName(tableName)
        if (isDefined(table)) {
            let scrapeTable = new ScrapeTable(tableName)
            scrapeTable.header = readTableHeader(table)
            scrapeTable.rows = readTableRows(table, readTableCellFunc)
            return scrapeTable
        }
    } catch (ex) {
        console.error("Error scraping table: " + tableName + ".\n", ex)
    }
    return new ScrapeTable(tableName)
}

function scrapePcrBuildIssues() {
    let re = new RegExp(/Primer (.*?) has %GC outside of desired range/)
    try {
        let allNoteItemNames = Array.from(document.getElementsByClassName("noteitem"))
            .map(noteItemEl => re.exec(noteItemEl.innerText)?.at(1))
            .filter(isDefined)
        let uniqNoteItemNames = allNoteItemNames
            .filter((noteItem, pos) => allNoteItemNames.indexOf(noteItem) === pos)
        return new PcrIssues(uniqNoteItemNames)
    } catch (ex) {
        console.error("Error scrapePcrBuildIssues: " + ex)
    }
    return new PcrIssues([])
}

///////////////////////////////////////////////////////////////

function handleRequest(request) {
    //console.log("-- Request --")
    //console.log(request)
    if (request.type === RequestType.PCR_START_RANGES) {
        let pcrName = request.data[0]

        // EDIT THE PCR
        actionEditPcrFragment(pcrName)

        // GET THE NUMBERS
        let subStart = document.getElementById("substart").value
        let subEnd = document.getElementById("subend").value

        // CLOSE
        actionEditPcrCancel()

        // RESPOND WITH NUMBERS
        let port = getPort(new Message(ResponseType.PCR_START_RANGES))
    }
}

function getPort() {
    if (!isDefined(nebuilder_port)) {
        var nebuilder_port = chrome.runtime.connect({name: "neb_tools_cs"})
        nebuilder_port.onDisconnect = () => nebuilder_port = undefined
        nebuilder_port.onMessage.addListener((message, _) => handleRequest(message))
    }
    return nebuilder_port
}

// ACTION: EDIT PCR FRAGMENT
function actionEditPcrFragment(pcrName) {
    let fragLabels = document.querySelectorAll(".fraglabel")
    let fragment = fragLabels.find(label => label.innerText.trim() === pcrName).parentElement.parentElement
    let fragEditButton = fragment.querySelector(".glyphicon-pencil")
    fragEditButton.click();
}

function actionEditPcrCancel() {
    document.querySelector('[ng-click="cancelUpdate()"]').click()
}

// ACTION: SCRAPE DATA
function actionScrapeData() {
    let port = getPort()

    // Read Table 'Component Fragments'
    let tableData1 = scrapeTable("Component Fragments", readTableCell)
    if (tableData1.rows.length > 0) {
        port.postMessage(new Message(ResponseType.TABLE_COMPONENT_FRAGMENT, tableData1))
    }

    // Read Table 'Required Oligonucleotides'
    let tableData2 = scrapeTable("Required Oligonucleotides", readTableCell)
    if (tableData2.rows.length > 0) {
        port.postMessage(new Message(ResponseType.TABLE_REQUIRED_OLIG, tableData2))
    }

    // Read in issues with build
    let pcrBuildIssues = scrapePcrBuildIssues()
    if (pcrBuildIssues.names.length > 0) {
        port.postMessage(new Message(ResponseType.PCR_OUTSIDE_DESIRED_RANGE, pcrBuildIssues))
    }
}

actionScrapeData()