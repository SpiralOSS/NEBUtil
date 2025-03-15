// cs_nebuilder.js
//

function memberExists(member) {
    let notExists = false
    notExists = notExists || member === null
    notExists = notExists || member === undefined
    return !notExists
}

function hasClassName(elem, className) { return elem.classList !== undefined && elem.classList.contains(className) }

function findTableByName(tableName) {
    let tableHeadersElem = Array.from(document.getElementsByTagName("h5"))
    let tableHeaderElem = tableHeadersElem.find(t => t.innerText === tableName)
    return tableHeaderElem.parentElement.parentElement.getElementsByTagName("table")[0]
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
            if (td.innerText !== undefined) {
                return td.innerText
            } else if (td.data !== undefined) {
                return td.data.toString()
            }
        })
        .map(text => text.replace('"', '').trim())
        .join("")
}

function newScrapeDataItem(name, type, data) {
    let ret = {}
    ret.name = name
    ret.type = type
    ret.data = data
    return ret
}

function scrapeTable(tableName, readTableCellFunc) {
    try {
        let table = findTableByName(tableName)
        if (table !== undefined) {
            return newScrapeDataItem(tableName, "scrape_table", {
                header: readTableHeader(table),
                rows: readTableRows(table, readTableCellFunc)
            })
        }
    } catch (ex) {
        console.error("Error scraping table: " + tableName + ".\n", ex)
    }
    return undefined
}

function scrapePcrBuildIssues() {
    let re = new RegExp(/Primer (.*?) has %GC outside of desired range/)
    try {
        let noteItems = document.getElementsByClassName("noteitem")
        let zz = Array.from(noteItems)
            .map(noteItemEl => re.exec(noteItemEl.innerText)?.at(1))
            .filter(_ => _ !== undefined)
            .map(noteItemName => newScrapeDataItem(noteItemName, "pcr_build_issue", {}))
    } catch (ex) {
        console.error("Error scrapePcrBuildIssues: " + ex)
    }
    return []
}

// CREATE THE PORT TO SERVICE WORKER / EXTENSION
if (port === undefined) {
    var port = chrome.runtime.connect({name: "neb_tools_cs"})
    port.onDisconnect.addListener((_) => port = undefined)
}

function scrapeData() {
    // SCRAPE DATA
    //  [
    //      { name: "...", type: "scrape_table",
    //        data: { header: [col1, col2, ...], rows: [ [ val11, val12 ], ... ] }
    //      },
    //      { name: "...", type: "pcr_build_issue",
    //        data: {}
    //      },
    //      ...
    //  ]
    let scrapeData = []

    // Read Table 'Component Fragments'
    let tableData = scrapeTable("Component Fragments", readTableCell)
    if (tableData !== undefined) {
        scrapeData.push(tableData)
    }

    // Read Table 'Required Oligonucleotides'
    tableData = scrapeTable("Required Oligonucleotides", readTableCell)
    if (tableData !== undefined) {
        scrapeData.push(tableData)
    }

    // Read in issues with build
    let buildIssueNames = scrapePcrBuildIssues()
    buildIssueNames.forEach(issue => scrapeData.push(buildIssueNames))

    port.postMessage( { cs_data: scrapeData } );
}

scrapeData()