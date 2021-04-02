const electron = require('electron');
const Store = require('electron-store');
const { app, ipcMain } = electron;
const { shell } = require('electron');

const DAWProjectSearcher = require('./daw-project-searcher').DAWProjectSearcher;
const WindowController = require('./window-controller');
const DatabaseController = require('./database-controller');

let dawProjectSearcher = new DAWProjectSearcher();
let databaseController = new DatabaseController();
let windowController;

// SET ENV
//process.env.NODE_ENV = 'production';

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
    //if('null' != newUserSearchDirectories){
        windowController.mainWindow.webContents.send('updateusersearchpaths',newUserSearchDirectories.directories);
    //}
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

// Perform the directory scan on array of directory paths to be searched
// TODO Scan more than just the first (index=0) directory passed in
ipcMain.on('startscan', function (e, directories) {
    let projects = dawProjectSearcher.searchForProjects(directories);
    projects.forEach(project => {
        //console.log(project);
        databaseController.createProject(project.dir.fullPath, project);
    });
     // TODO Refactor - create methods to send web content without interacting with window objects
    windowController.mainWindow.webContents.send('scan:complete:allentries', projects);
});




