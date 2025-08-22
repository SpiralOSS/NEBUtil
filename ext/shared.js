
// From ContentScript to Extension
const ResponseType = {
    TABLE_COMPONENT_FRAGMENT: 0,
    TABLE_REQUIRED_OLIG: 1,
    PCR_OUTSIDE_DESIRED_RANGE: 2,
    PCR_START_RANGES: 3,
}

// From Extenstion to ContentScript
const RequestType = {
    PCR_START_RANGES: 0,
}