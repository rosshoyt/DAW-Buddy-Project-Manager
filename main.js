const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { app, BrowserWindow, Menu, ipcMain } = electron;
const { shell } = require('electron')

const store = new Store();


// SET ENV
//process.env.NODE_ENV = 'production';

let mainWindow;
let addWindow;
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
    mainWindow.setSize(1024,768);

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);
});

// TODO Could catch dir:add here to process on main thread
// ipcMain.on('dir:add', function(e, dir){
//     console.log("Inside dir:add", dir);
//     mainWindow.webContents.send('dir:add', dir);
// })


// Perform the directory scan on array of directory paths to be searched
// TODO Scan more than just the first (index=0) directory passed in
ipcMain.on('startscan', function (e, directories) {
    console.log('[Main Thread] Scanning directories:');

    // TODO Implement New Approach (Recursive + sencond, iterative)
    // const projectDirectories = getPossibleDAWProjectDirectories(directories[0]);
    // projectDirectories.forEach((item,index) => {
    //     console.log({ index, item });
    // });

    // OG Approach(recursive):
    // Scan directories, extract relevant data and return results to renderer thread
    // TODO ensure no duplicate paths are searched unnecissarily
    // First find all directories which contain a music project
    // TODO support more than just first listed directory path
    const projects = getAllDAWProjects(directories[0]);
    console.log('All Ableton directories found in ', directories[0]);
    projects.forEach((item,index) => {
        //console.log({ index, item });
        
        store.set(item.fullPath, item);
        console.log(store.get(item.fullPath));
    });

    // Send projects to renderer thread for display
    mainWindow.webContents.send('scan:complete', projects);
});

// Handle create add window
function createDetailWindow(projectPath) {
    const projDetails = store.get(projectPath);
    console.log('creating detail window for project ', projDetails);

    // create new window with dimensions 3/4 size of main window
    let newWindow = new BrowserWindow({
        width: 768,
        height: 576, 
        title: projDetails.projectName + ' Project Details',

        // TODO Implement secure solution https://stackoverflow.com/a/57049268
        // Solves Uncaught ReferenceError: 'require' is not defined
        webPreferences: {
            nodeIntegration: true
        }
    });
    // send project details object to detail window
    newWindow.projectDetails = projDetails;

    // load html into window
    newWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'detailWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Handle garbage collection
    newWindow.on('close', function () {
        detailWindows.delete(newWindow);
        newWindow = null;
    });
    
    detailWindows.add(newWindow);
    
}

// Catch item:add TODO remove
ipcMain.on('item:add', function (e, item) {
    //console.log(item);
    mainWindow.webContents.send('item:add', item);
    newWindow.close();
});

// user wants to view project details in new detail window
ipcMain.on('getprojectdetail', function(e, projectPath){
    createDetailWindow(projectPath);
});

// user requests to open path location in system explorer
ipcMain.on('openitem', function(e,fullPath){
    shell.showItemInFolder(fullPath);
});


// helper function which returns index of item in JS array, or -1 if not found
Array.prototype.indexOfObject = function (property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
}

// Method that recursively searches a provided directory path for DAW projects
// TODO test if works when base directory is itself a music project (should work)
const getAllDAWProjects = function (dirPath, arrayOfProjects) {
    arrayOfProjects = arrayOfProjects || [];
    var files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        // get filesystem info on current file
        filePath = dirPath + "/" + file;
        var fsInfo = fs.statSync(filePath);

        if (fsInfo.isDirectory()) {
            //dirBirthtime = fsInfo.birthtime;
            arrayOfProjects = getAllDAWProjects(filePath, arrayOfProjects);
        } else {
            var dawType;
            console.log('Testing file extension');
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
                var i = arrayOfProjects.indexOfObject('fullPath', dirPath);
                if (i >= 0) {
                    // project has been added, increment numProjFiles of existing entry
                    var project = arrayOfProjects[i];
                    project.numProjFiles++;
                    // TODO: create function so that projectFIle objects are created in one place
                    var projectFile = {
                        fileName: file,
                        dateCreated: fsInfo.birthtime
                    }
                    project.projectFiles.push(projectFile);
                    
                } else {
                    // Project hasn't been added, create and add project to list!

                    // Get the project name from the containing dir's path 
                    // TODO could offer more options for determining name of project (name of earliest proj file in directory could be option )
                    // TODO validate string input 
                    var projectName = dirPath.substring(dirPath.lastIndexOf("/")+1, dirPath.length);
                    
                    // get project directory's birthtime TODO fix, currently gets file's birthtime
                    var projectDirBirthtime = fsInfo.birthtime;
                    console.log('Adding project at ', dirPath, ' with project name \"', projectName, '\" with birthtime ', projectDirBirthtime);

                    var projectFile = {
                        fileName: file,
                        dateCreated: fsInfo.birthtime
                    }

                    var dawProject = {
                        fullPath: dirPath, // Primary Key UID for DAW Project
                        daw: dawType,
                        projectName: projectName, 
                        dateCreated: projectDirBirthtime,
                        numProjFiles: 1,
                        projectFiles: [
                            projectFile
                        ]
                        //,mediaFiles: [{}]
                    };
                    arrayOfProjects.push(dawProject);

                    // Example object with nested array of objects:
                    // const data = {
                    //   code: 42,
                    //   items: [{
                    //       id: 1,
                    //       name: 'foo'
                    //     }, {
                    //       id: 2,
                    //       name: 'bar'
                    //     }]
                    // };

                }
            }
        }
    });
    return arrayOfProjects;
}

// TODO FIX
// Method that recursively searches a provided directory path for possible DAW Project Directories
const getPossibleDAWProjectDirectories = function (dirPath, possibleProjectDirectories) {
    possibleProjectDirectories = possibleProjectDirectories || [];
    var files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        // get filesystem info on current file
        filePath = dirPath + "/" + file;
        var fsInfo = fs.statSync(filePath);

        if (fsInfo.isDirectory()) {
            //dirBirthtime = fsInfo.birthtime;
            possibleProjectDirectories = getPossibleDAWProjectDirectories(filePath, possibleProjectDirectories);
        } else {
            var dawType;
            console.log('Testing file extension');
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
                console.log('fullPath: ', dirPath);
                // TODO Fix error here
                if(possibleProjectDirectories.indexOfObject('fullPath', dirPath) == -1){
                    // we haven't added this possible project directory to list
                    var possibleProjectDir = {
                        fullPath: dirPath,
                        daw: dawType
                    };
                    possibleProjectDirectories.push(possibleProjectDir);
                }
            }
        }
    });
}

// Create menu template
const mainMenuTemplate = [
    {
        label: process.platform == 'darwin' ? '' : app.getName(),
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
    },
    {
        label: 'File',
        submenu: [
            // {
            //     label: 'Add Item',
            //     click() {
            //         createDetailWindow();
            //     }
            // },
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
    }
];

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
