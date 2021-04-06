const AdvancedArray = require('../common/advanced-array');
const DAWProjectEntry = require('../model/daw-project-entry');
const StringUtils = require('../common/string-utils');
const FileInfo = require('../model/file-info');
const fs = require('fs');
const path = require('path');

// Class which searches directories recursively for DAW projects.
// Manages search state and TODO controls search speed to allow
class DAWProjectSearcher {
    constructor() {
        // TODO get domain-model info from JSON
        //this.domain = JSON.parse('../model/domain-model.json');
        
    }

    // Function that scans the directory and all sub directories to find DAW projects, 
    // and returns an AdvancedArray of projects found
    getDAWProjects(directory) {
        console.log("Finding DAW projects in " + directory);
        const projectEntries = this.findDAWProjects(directory);
        console.log("Analyzing DAW projects");
        // Analyze each directory and extract database entries
        var self = this;
        projectEntries.forEach((projectEntry, index) => {
            //console.log("Analyzing DAW project");
            projectEntry.dir.files = self.scanDAWProjectFolder(projectEntry.dir.fullPath);
            // extract more high-level data from the project entry
            self.analyzeProjectDir(projectEntry.dir.files, projectEntry);
            //console.dir(projectEntry, { depth: null });
        });
        return projectEntries;
    }
    // Method that recursively searches a provided directory path for all possible DAW Project Directories
    findDAWProjects(dirPath, arrayOfProjectPaths) {
        console.log('finding daw project...');
        arrayOfProjectPaths = arrayOfProjectPaths || new AdvancedArray();
        var fileNames = fs.readdirSync(dirPath);
        var self = this;
        
        
        fileNames.forEach(function (file) {
            // get filesystem info on current file
            var filePath = dirPath + "/" + file;
            try{
            var fsInfo = fs.statSync(filePath);
            if (fsInfo.isDirectory()) {
                //dirBirthtime = fsInfo.birthtime;
                arrayOfProjectPaths = self.findDAWProjects(filePath, arrayOfProjectPaths);
            } else {
                var dawType;
                switch (path.extname(file)) {
                    // TODO Refactor to hashset k/v 
                    case '.als':
                        dawType = 'Ableton';
                        break;
                    case '.ptx':
                        dawType = 'ProTools';
                        break;
                    case '.cpr':
                        dawType = 'Cubase';
                        break;
                    case '.dpdoc':
                        dawType = 'Digital Performer';
                        break;
                    case '.dp3':
                        dawType = 'Digital Performer';
                        break;
                    case '.rpp':
                        dawType = 'Reaper';
                        break;
                    case '.rpprj':
                        dawType = 'Reaper';
                        break;

                    // TODO support logic projects - appears as directory on windows
                    // case '.logic': 
                    //     dawType = 'Logic';
                    //     break;
                    // case '.logicx':
                    //     dawType = 'Logic';
                    //     break;
                    //
                    // TODO support Garageband (.band, .gbproj)
                    //
                    // TODO Support Studio One, Reason, Bitwig Studio, and more 
                    //
                    // TODO Support audio-waveform editors (Audition, Sound Forge, Wavelab etc)
                    // case '.sesx' // Adobe Audition

                    default:
                        dawType = 'none';
                }
                if (dawType !== 'none') {
                    // check if project has already been discovered by comparing the primary key (full directory path)
                    var i = arrayOfProjectPaths.indexOfObjectWithNestedProp(['dir', 'fullPath'], dirPath);
                    if (i == -1) {
                        // Extract name of project from the path
                        let projectName = StringUtils.removeAllPrecedingDirectories(dirPath);
                        // Verify if this project is 'Backup (PT)' or 'Session File Backups' (PT) or 'Autosaves' (DP)
                        // TODO allow for users to scan projects in directories deliberately named this way (edge case)
                        if (projectName !== "Backup" && projectName !== "Session File Backups" && projectName !== "Autosaves") {
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
            // catch errors from file system access
            } catch(error){
                console.log(error);
            }
        });
    
        return arrayOfProjectPaths;
    }

    analyzeProjectDir(fileInfos, dawProjectEntry) {
        var self = this;
        fileInfos.forEach(function (fileInfo) {
            dawProjectEntry.totalBytes += fileInfo.byteSize;
            if (fileInfo.isDirectory) {
                self.analyzeProjectDir(fileInfo.files, dawProjectEntry);
            } else {
                // TODO avoid code duplication by combining this stage with findDAWProjects()
                switch (fileInfo.extension) {
                    // daw files
                    case '.als':
                        dawProjectEntry.dawFiles.push(fileInfo);
                        break;
                    case '.ptx':
                        dawProjectEntry.dawFiles.push(fileInfo);
                        break;
                    case '.cpr':
                        dawProjectEntry.dawFiles.push(fileInfo);
                        break;
                    case '.dpdoc':
                        dawProjectEntry.dawFiles.push(fileInfo);
                        break;
                    case '.dp3':
                        dawProjectEntry.dawFiles.push(fileInfo);
                        break;
                    case '.rpp':
                        dawProjectEntry.dawFiles.push(fileInfo);
                        break;
                    case '.rpprj':
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

    scanDAWProjectFolder(dirPath) {
        // create the file info list to be returned
        let fileInfos = [];
        // get the file names in the directory
        var fileNames = fs.readdirSync(dirPath);
        var self = this;
        // analyze each file in directory 
        fileNames.forEach(function (fileName) {
            // get filesystem info on current file 
            // TODO make sure filePath is configured for host OS
            var filePath = dirPath + "/" + fileName;
            // create the persistable FileInfo object
            let fileInfo = new FileInfo(filePath);
            if (fileInfo.isDirectory) {
                // Recursively scan sub-directory
                fileInfo.files = self.scanDAWProjectFolder(filePath);
            } else {
                // track the file's extension
                fileInfo.extension = path.extname(fileInfo.fullPath);
            }
            // add to list
            fileInfos.push(fileInfo);
        });
        return fileInfos;
    }
}



// expose class
module.exports = { DAWProjectSearcher }



