// Function that takes a path string and removes the containing directories 
// TODO validate input length
function removeAllPrecedingDirectories(fullPath) {
    // TODO platform-dependant parsing of /, \ etc
    return fullPath.substring(fullPath.lastIndexOf("/") + 1, fullPath.length);
}

function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
    } while (fileSizeInBytes > 1024);
    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
  };
module.exports = { getReadableFileSizeString, removeAllPrecedingDirectories }