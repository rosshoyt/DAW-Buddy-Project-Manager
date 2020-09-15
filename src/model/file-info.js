const fs = require('fs');
const StringUtils = require('../common/string-utils');
// Object with information about a file or directory
class FileInfo{
    constructor(fullPath, fileStats = fs.statSync(fullPath)){
        this.fullPath = fullPath;
        this.fileName = StringUtils.removeAllPrecedingDirectories(fullPath);
        this.isDirectory = fileStats.isDirectory();
        this.extension = '';
        this.timeLastAccessed = fileStats.atime;
        this.timeLastModified = fileStats.mtime;
        // TODO determine if need the time of last file status change
        //timeStatusLastChanged = fileStats.ctime;
        this.timeCreated = fileStats.birthtime;
        this.byteSize = fileStats.size;
        this.isFavorite = false;
    }
}
module.exports = FileInfo