// Function that takes a path string and removes the containing directories 
// TODO validate input length
function removeAllPrecedingDirectories(fullPath) {
    return fullPath.substring(fullPath.lastIndexOf("/") + 1, fullPath.length);
}
module.exports = { removeAllPrecedingDirectories }