const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');

const { app, BrowserWindow, Menu, ipcMain } = electron;

// SET ENV
//process.env.NODE_ENV = 'production';

let mainWindow;
let addWindow;

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
    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);
});

// Handle create add window
function createAddWindow() {
    // create new window
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add Shopping List Item',


        // TODO Implement secure solution https://stackoverflow.com/a/57049268
        // Solves Uncaught ReferenceError: 'require' is not defined
        webPreferences: {
            nodeIntegration: true
        }

    });
    // load html into window
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Handle garbage collection
    addWindow.on('close', function () {
        addWindow = null;
    });


}

// Catch item:add
ipcMain.on('item:add', function(e, item){
    //console.log(item);
    mainWindow.webContents.send('item:add', item);
    addWindow.close();

});


// TODO Could catch dir:add here to process on main thread
// ipcMain.on('dir:add', function(e, dir){
//     console.log("Inside dir:add", dir);
//     mainWindow.webContents.send('dir:add', dir);
// })

// Catch startscan
ipcMain.on('startscan', function(e, directories){
    console.log('[Main Thread] Scanning directories:');
    // directories.forEach((item, index) => {
    //     console.log({ index, item });
    // });

    // Scan directories, extract relevant data and return results to renderer thread
    // TODO ensure no duplicate paths are searched unnecissarily
    const files = getAllAbletonProjectDirectories(directories[0]);
    console.log('All Ableton directories found in ' , directories[0]);
    files.forEach((item,index) => {
        console.log({ index, item });
    });


});


const getAllAbletonProjectDirectories = function(dirPath, arrayOfProjects) {
  files = fs.readdirSync(dirPath);

  arrayOfProjects = arrayOfProjects || [];

  files.forEach(function(file) {
    var fileInfo = fs.statSync(dirPath + "/" + file);
    if (fileInfo.isDirectory()) {
      arrayOfProjects = getAllAbletonProjectDirectories(dirPath + "/" + file, arrayOfProjects);
    } else {
      if(path.extname(file) == '.als'){
        //if(arrayOfProjects.some(e => e.fullPath === dirPath)){
        //var projIndex = arrayOfProjects.indexOf();
        var i = arrayOfProjects.indexOfObject('fullPath', dirPath);
        if(i >= 0){
          var numProjFiles = arrayOfProjects[i].numProjFiles++;
          console.log('For project ', arrayOfProjects[i].projectName,'Incremented numProjectFiles to ', numProjFiles);
        //if (typeof arr.find(n => n === freeNumber) !== 'undefined') {
        //     ++freeNumber;
        // } else {
        //     isTaken = false;
        // }
          // project has been added, increment numProjFiles of existing entry



        } else{
          // Create and add Ableton project to list
          var abletonProject = { fullPath: dirPath, projectName:file,  dateCreated:fileInfo.birthtime, numProjFiles:1};
          //arrayOfProjects.push(path.join(__dirname, , "/", file));
          arrayOfProjects.push(abletonProject);
        }


      }
    }
  });

  return arrayOfProjects;
}

Array.prototype.indexOfObject = function (property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
}
// function getExtension(filename) {
//     return filename.split('.').pop();
// }

// Create menu template
const mainMenuTemplate = [
    {
        label: process.platform == 'darwin' ? '' :app.getName(),
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
            {
                label: 'Add Item',
                click() {
                    createAddWindow();
                }
            },
            {
                label: 'Clear Items',
                click(){
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
