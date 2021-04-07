const electron = require('electron');
const { app, ipcMain } = electron;
const { shell } = require('electron');

// require and configure dotenv
require('dotenv').config();

// SET ENV
//process.env.NODE_ENV = 'production';

const DAWProjectSearcher = require('./daw-project-searcher').DAWProjectSearcher;
const WindowController = require('./window-controller');
const DatabaseController = require('./database-controller');

let dawProjectSearcher = new DAWProjectSearcher();
let databaseController = new DatabaseController();
let windowController;

// Listen for app to be ready
app.on('ready', function () {
    windowController = new WindowController(1920, 1080);
    windowController.createMainWindow();
});

 // reads the user's search paths from the database and updates the main window if any were found
ipcMain.on('readusersearchpaths', function(e){
    var userSearchDirs = databaseController.readUserSearchDirectories();
    if(userSearchDirs == null){
        return;
    }
    // if any entries were read, send to the main window
    windowController.mainWindow.webContents.send('updateusersearchpaths', userSearchDirs.directories);
})

// creates or updates the user search paths entry in the database with a provided string path
// @var filepath - full path string
ipcMain.on('createupdateusersearchpaths', function(e, filePath){
    databaseController.addUserSearchDirectory(filePath);
    // tell the renderer to pull the new data from the database, if there were changes
    var newUserSearchDirectories = databaseController.readUserSearchDirectories();
    windowController.mainWindow.webContents.send('updateusersearchpaths',newUserSearchDirectories.directories);

});

// Catch getprojectdetail 
// Called when user wants to view a project's details in a detail window
ipcMain.on('getprojectdetail', function (e, projectPath) {
    windowController.createDetailWindow(databaseController.readProject(projectPath));
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
    console.log('Main thread - opening in system file browser', preparedPath);
    shell.showItemInFolder(preparedPath);
});

// Catch cleardb
// Deletes all content from the local database
// TODO allow clearing of specific types of data     
ipcMain.on('cleardb', function(e){
    databaseController.clearLocalDatabase();
});

// Performs the scan on array of directory paths to be searched
// On completion, updates the database and main window with the discovered DAW projects
ipcMain.on('startscan', function (e, directories) {
    let projects = [];
    directories.forEach(directory =>{
        projects = projects.concat(dawProjectSearcher.getDAWProjects(directory));
    });
    
    projects.forEach(project => {
        //console.log(project);
        databaseController.createProject(project.dir.fullPath, project);
    });
    
     // TODO could have mainWindow refresh and get the data itself
    windowController.mainWindow.webContents.send('scan:complete:allentries', projects);
});
});