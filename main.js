const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { app, BrowserWindow, Menu, ipcMain } = electron;
const { shell } = require('electron');
const DAWProjectEntry = require('./DAWProjectEntry.js');

// Create in-memory database TODO persist data beyond single session    
const store = new Store();

// SET ENV
//process.env.NODE_ENV = 'production';

let mainWindow;
const detailWindows = new Set();

// Listen for app to be ready
app.on('ready', function () {
    // create new window
    mainWindow = new BrowserWindow({
        // TODO Implement secure solution https://stackoverflow.com/a/57049268
        // Solves Uncaught ReferenceError: 'require' is not defined
        webPreferences: {
            nodeIntegration: true
        }
    });
    // load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Quit app when closed
    mainWindow.on('closed', function () {
        app.quit();
    });
    // Set window size
    mainWindow.setSize(1024, 768);

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(getMenuTemplate());
    // Insert menu
    Menu.setApplicationMenu(mainMenu);
});

// Handle create detail window
function createDetailWindow(projectPath) {
    console.log('creating detail window for project at path', projectPath);
    const projEntry = store.get(projectPath);

    // create new window with dimensions 3/4 size of main window
    let detailWindow = new BrowserWindow({
        width: 768,
        height: 576,
        title: projEntry.projectName + ' - DAW Buddy',
        // TODO Implement secure solution https://stackoverflow.com/a/57049268
        // Solves Uncaught ReferenceError: 'require' is not defined
        webPreferences: {
            nodeIntegration: true
        }
    });
    // send project details object to detail window
    detailWindow.projectDetails = projEntry;
    // load html into window
    detailWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'detailWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    detailWindow.on('close', function () {
        detailWindows.delete(detailWindow);
        detailWindow = null;
    });
    detailWindows.add(detailWindow);
}

// Catch getprojectdetail 
// Called when user wants to view a project's details in a detail window
ipcMain.on('getprojectdetail', function (e, projectPath) {
    createDetailWindow(projectPath);
});

// Catch openitem 
// Called when user requests to open a full path location in system explorer
// TODO Debug Windows, Linux functionality
ipcMain.on('openitem', function (e, fullPath) {
    var preparedPath;
    switch (process.platform) {
        case 'win32':
            // TODO Debug and test windows paths
            preparedPath = fullPath.replace(/\//g, '\\');
            break;
        case 'linux':
            preparedPath = "\"" + fullPath + "\"";
            break;
        default:
            preparedPath = fullPath;
    }
    console.log('Main thread - opening ', preparedPath);
    shell.showItemInFolder(preparedPath);
});

// Perform the directory scan on array of directory paths to be searched
// TODO Scan more than just the first (index=0) directory passed in
ipcMain.on('startscan', function (e, directories) {
    //console.log('[Main Thread] Scanning directories:');
    // Recursively scan directories to find possible DAW project directories
    const projectEntries = findDAWProjects(directories[0]);
    //console.log('Found ', projectEntries.length, ' DAW projects');
    // Analyze each directory and extract database entries
    projectEntries.forEach((projectEntry, index) => {
        projectEntry.dir.files = scanDAWProjectFolder(projectEntry.dir.fullPath);
        // extract more high-level data from the project entry
        analyzeProjectDir(projectEntry.dir.files, projectEntry);
        //console.dir(projectEntry, { depth: null });
        // TODO ensure entry has unique ID
        store.set(projectEntry.dir.fullPath, projectEntry);
        mainWindow.webContents.send('scan:complete:singleentry', projectEntry);
    });
});

// Method that recursively searches a provided directory path for all possible DAW Project Directories
const findDAWProjects = function (dirPath, arrayOfProjectPaths) {
    arrayOfProjectPaths = arrayOfProjectPaths || [];
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
                    let projectName = dirPath.removeAllPrecedingDirectories(dirPath);
                    // Verify if this project is 'Backup (PT)' or 'Session File Backups' (PT)
                    // TODO allow for users to scan projects in directories deliberately named this way (edge case)
                    if (projectName !== "Backup" && projectName !== "Session File Backups") {
                        // Project hasn't been added, add to list!
                        let dawProject = new DAWProjectEntry(projectName);
                        // Set info about project's root directory
                        dawProject.dir = createFileInfoObject(dirPath);
                        // Set Project's DAW Type
                        dawProject.dawType = dawType;// TODO validate DAWtype designation process to support projects with multiple types of DAW files (.ptx & .als) in same directory 
                        // Add entry to list
                        arrayOfProjectPaths.push(dawProject);
                    } 
                }
            }
        }
    });
    return arrayOfProjectPaths;
}

const analyzeProjectDir = function (files, dawProjectEntry) {
    //console.log('analyzing project dir', dawProjectEntry.dir.fullPath);
    //console.log('files = ', files);
    files.forEach(function (file) {
        dawProjectEntry.totalBytes += file.byteSize;
        if (file.isDirectory) {
            analyzeProjectDir(file.files, dawProjectEntry);
        } else {
            switch (file.extension) {
                // DAW files
                case '.als':
                    dawProjectEntry.dawFiles.push(file);
                    break;
                case '.ptx':
                    dawProjectEntry.dawFiles.push(file);
                    break;
                case '.logic':
                    dawProjectEntry.dawFiles.push(file);
                    break;
                case '.als':
                    dawProjectEntry.dawFiles.push(file);
                    break;


                // audio files
                case '.wav':
                    dawProjectEntry.audioFiles.push(file);
                    break;
                case '.aiff':
                    dawProjectEntry.audioFiles.push(file);
                    break;
                case '.mp3':
                    dawProjectEntry.audioFiles.push(file);
                    break;
                case '.ogg':
                    dawProjectEntry.audioFiles.push(file);
                    break;

                // video files
                case '.mp4':
                    dawProjectEntry.videoFiles.push(file);
                    break;
                case '.mov':
                    dawProjectEntry.videoFiles.push(file);
                    break;
                // other files - 'uncategorized'
                default:
                    dawProjectEntry.uncatFiles.push(file);
                    break;
            }
        }
    });
    //for(let i = 0; i < fileArray.length);
}
// function that returns an object with information about a file or directory
// TODO implement factory pattern
// TODO move ALL fs.statSync calls to this function
const createFileInfoObject = function (fullPath) {
    var fileStats = fs.statSync(fullPath);
    return {
        fullPath: fullPath,
        isDirectory: fileStats.isDirectory(),
        extension: '',
        timeLastAccessed: fileStats.atime,
        timeLastModified: fileStats.mtime,
        // TODO determine if need the time of last file status change
        //timeStatusLastChanged: fileStats.ctime,
        timeCreated: fileStats.birthtime,
        byteSize: fileStats.size
    };
}

const scanDAWProjectFolder = function (dirPath) {
    //console.log('Scanning Folder ', dirPath);
    // create the file info list to be returned
    let fileInfos = [];

    // get the file names in the directory
    var fileNames = fs.readdirSync(dirPath);

    // analyze each file in directory 
    // TODO rename 'file' to 'fileName' (unless variable is not String)
    fileNames.forEach(function (fileName) {
        // get filesystem info on current file 
        // TODO make sure filePath is configured for host OS
        var filePath = dirPath + "/" + fileName;

        // create the persistable FileInfo object
        let fileInfo = createFileInfoObject(filePath);

        if (fileInfo.isDirectory) {
            // Recursively scan sub-directory
            fileInfo.files = scanDAWProjectFolder(filePath);
        }
        else {
            // track the file's extension
            fileInfo.extension = path.extname(fileInfo.fullPath);
        }
        // add to list
        fileInfos.push(fileInfo);
    });
    return fileInfos;
}

// TODO validate input
String.prototype.removeAllPrecedingDirectories = function (fullPath) {
    return fullPath.substring(fullPath.lastIndexOf("/") + 1, fullPath.length);
}

const getMenuTemplate = function () {
    let mainMenuTemplate = [];
    if (process.platform == 'darwin') {
        mainMenuTemplate.push({
            label: process.platform = app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }
    mainMenuTemplate.push({
        label: 'File',
        submenu: [
            {
                label: 'Clear Items',
                click() {
                    mainWindow.webContents.send('item:clear');
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    });

    // Add developer tools option if in dev
    if (process.env.NODE_ENV !== 'production') {
        mainMenuTemplate.push({
            label: 'Developer Tools',
            submenu: [
                {
                    role: 'reload'
                },
                {
                    label: 'Toggle DevTools',
                    accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                }
            ]
        });
    }
    return mainMenuTemplate;
}

// helper function which returns index of item with nested property in JS array, or -1 if not found
// TODO bug-check
Array.prototype.indexOfObjectWithNestedProp = function (properties, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (properties.length > 0) {
            // get initial object
            var nestedObj = this[i][properties[0]];
            // iterate to nested object
            for (var j = 1, propLen = properties.length; j < propLen; j++)
                nestedObj = nestedObj[properties[j]];
            if (nestedObj === value) return i;
        }
    }
    return -1;
}

// helper function which returns index of item in JS array, or -1 if not found
Array.prototype.indexOfObject = function (property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
}