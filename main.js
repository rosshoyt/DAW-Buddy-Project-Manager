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

// TODO Could catch dir:add here to process on main thread
// ipcMain.on('dir:add', function(e, dir){
//     console.log("Inside dir:add", dir);
//     mainWindow.webContents.send('dir:add', dir);
// })

// Catch item:add TODO remove
ipcMain.on('item:add', function(e, item){
    //console.log(item);
    mainWindow.webContents.send('item:add', item);
    addWindow.close();
});

// Perform the directory scan on array of directory paths to be searched
// TODO Scan more than just the first (index=0) directory passed in
ipcMain.on('startscan', function(e, directories){
    console.log('[Main Thread] Scanning directories:');

    // Scan directories, extract relevant data and return results to renderer thread
    // TODO ensure no duplicate paths are searched unnecissarily
    const files = getAllAbletonProjectDirectories(directories[0]);

    //console.log('All Ableton directories found in ' , directories[0]);
    // files.forEach((item,index) => {
    //     console.log({ index, item });
    // });

    // Send projects to renderer thread for display
    mainWindow.webContents.send('scan:complete',files);
});

// Method that recursively searches a provided directory path for Ableton Live projects
const getAllAbletonProjectDirectories = function(dirPath, arrayOfProjects, dirBirthtime) {
  files = fs.readdirSync(dirPath);
  arrayOfProjects = arrayOfProjects || [];
  //var dirBirthtime;
  files.forEach(function(file) {
    // get filesystem info on current file
    var fsInfo = fs.statSync(dirPath + "/" + file);
    if (fsInfo.isDirectory()) {
      //dirBirthtime = fsInfo.birthtime;
      arrayOfProjects = getAllAbletonProjectDirectories(dirPath + "/" + file, arrayOfProjects, fsInfo.birthtime);
    } else {
      if(path.extname(file) == '.als'){
        var i = arrayOfProjects.indexOfObject('fullPath', dirPath);
        if(i >= 0){
          // project has been added, increment numProjFiles of existing entry
          var numProjFiles = arrayOfProjects[i].numProjFiles++;
          // TODO add Ableton File details to Project entry
        } else{
          // Project hasn't been added, create and add Ableton project to list
          var abletonProject = {
            fullPath: dirPath,
            projectName: file,
            dateCreated: fsInfo.birthtime,
            numProjFiles: 1,
            projectFiles: [{}]
          };
          arrayOfProjects.push(abletonProject);

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

// helper function which returns index of item in JS array, or -1 if not found
Array.prototype.indexOfObject = function (property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
}

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
