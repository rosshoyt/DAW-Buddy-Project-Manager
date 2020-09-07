const fs = require('fs');
// Object with information about a file or directory
class FileInfo{
    constructor(fullPath, fileStats = fs.statSync(fullPath)){
        this.fullPath = fullPath;
        this.isDirectory = fileStats.isDirectory();
        this.extension = '';
        this.timeLastAccessed = fileStats.atime;
        this.timeLastModified = fileStats.mtime;
        // TODO determine if need the time of last file status change
        //timeStatusLastChanged = fileStats.ctime;
        this.timeCreated = fileStats.birthtime;
        this.byteSize = fileStats.size;
    }
}
module.exports = FileInfo