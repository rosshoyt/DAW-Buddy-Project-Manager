const AdvancedArray = require('../common/advanced-array');
const DAWProjectEntry = require('../model/daw-project-entry');
const StringUtils = require('../common/string-utils');
const FileInfo = require('../model/file-info');
const fs = require('fs');
const path = require('path');

// Function that scans the directory and all sub directories to find DAW projects, 
// and returns an AdvancedArray of projects found
const searchForProjects = function(directories){
    const projectEntries = findDAWProjects(directories[0]);
    // Analyze each directory and extract database entries
    projectEntries.forEach((projectEntry, index) => {
        projectEntry.dir.files = scanDAWProjectFolder(projectEntry.dir.fullPath);
        // extract more high-level data from the project entry
        analyzeProjectDir(projectEntry.dir.files, projectEntry);
        //console.dir(projectEntry, { depth: null });
    });
    return projectEntries;
}
// expose above method
module.exports = { searchForProjects }

// Method that recursively searches a provided directory path for all possible DAW Project Directories
const findDAWProjects = function(dirPath, arrayOfProjectPaths) {
    arrayOfProjectPaths = arrayOfProjectPaths || new AdvancedArray();
    var fileNames = fs.readdirSync(dirPath);
    fileNames.forEach(function (file) {
        // get filesystem info on current file
        filePath = dirPath + "/" + file;
        var fsInfo = fs.statSync(filePath);
        if (fsInfo.isDirectory()) {
            //dirBirthtime = fsInfo.birthtime;
            arrayOfProjectPaths = findDAWProjects(filePath, arrayOfProjectPaths);
        } else {
            var dawType;
            switch (path.extname(file)) {
                case '.als':
                    dawType = 'Ableton';
                    break;
                case '.ptx':
                    dawType = 'ProTools';
                    break;
                case '.cpr':
                    dawType = 'Cubase';
                    break;
                default:
                    dawType = 'none';
            }
            if (dawType !== 'none') {
                // check if project has already been discovered by comparing the primary key (full directory path)
                var i = arrayOfProjectPaths.indexOfObjectWithNestedProp(['dir', 'fullPath'], dirPath);
                if (i == -1) {
                    // Extract name of project from the path
                    let projectName = StringUtils.removeAllPrecedingDirectories(dirPath);
                    // Verify if this project is 'Backup (PT)' or 'Session File Backups' (PT)
                    // TODO allow for users to scan projects in directories deliberately named this way (edge case)
                    if (projectName !== "Backup" && projectName !== "Session File Backups") {
                        // Project hasn't been added, add to list!
                        let dawProject = new DAWProjectEntry(projectName);
                        // Set info about project's root directory
                        dawProject.dir = new FileInfo(dirPath);
                        // Set Project's DAW Type
                        // TODO validate DAWtype designation process to support projects with 
                        // multiple types of DAW files (.ptx & .als) in same directory
                        dawProject.dawType = dawType;
                        // Add entry to list
                        arrayOfProjectPaths.push(dawProject);
                    }
                }
            }
        }
    });
    return arrayOfProjectPaths;
}

const analyzeProjectDir = function(fileInfos, dawProjectEntry) {
    fileInfos.forEach(function (fileInfo) {
        dawProjectEntry.totalBytes += fileInfo.byteSize;
        if (fileInfo.isDirectory) {
            analyzeProjectDir(fileInfo.files, dawProjectEntry);
        } else {
            switch (fileInfo.extension) {
                // daw files
                case '.als':
                    dawProjectEntry.dawFiles.push(fileInfo);
                    break;
                case '.ptx':
                    dawProjectEntry.dawFiles.push(fileInfo);
                    break;
                case '.logic':
                    dawProjectEntry.dawFiles.push(fileInfo);
                    break;
                case '.als':
                    dawProjectEntry.dawFiles.push(fileInfo);
                    break;

                // audio files
                case '.wav':
                    dawProjectEntry.audioFiles.push(fileInfo);
                    break;
                case '.aiff':
                    dawProjectEntry.audioFiles.push(fileInfo);
                    break;
                case '.mp3':
                    dawProjectEntry.audioFiles.push(fileInfo);
                    break;
                case '.ogg':
                    dawProjectEntry.audioFiles.push(fileInfo);
                    break;

                // video files
                case '.mp4':
                    dawProjectEntry.videoFiles.push(fileInfo);
                    break;
                case '.mov':
                    dawProjectEntry.videoFiles.push(fileInfo);
                    break;

                // other files - 'uncategorized'
                default:
                    dawProjectEntry.uncatFiles.push(fileInfo);
                    break;
            }
        }
    });
}

const scanDAWProjectFolder = function(dirPath) {
    // create the file info list to be returned
    let fileInfos = [];
    // get the file names in the directory
    var fileNames = fs.readdirSync(dirPath);
    // analyze each file in directory 
    fileNames.forEach(function (fileName) {
        // get filesystem info on current file 
        // TODO make sure filePath is configured for host OS
        var filePath = dirPath + "/" + fileName;
        // create the persistable FileInfo object
        let fileInfo = new FileInfo(filePath);
        if (fileInfo.isDirectory) {
            // Recursively scan sub-directory
            fileInfo.files = scanDAWProjectFolder(filePath);
        } else {
            // track the file's extension
            fileInfo.extension = path.extname(fileInfo.fullPath);
        }
        // add to list
        fileInfos.push(fileInfo);
    });
    return fileInfos;
}

