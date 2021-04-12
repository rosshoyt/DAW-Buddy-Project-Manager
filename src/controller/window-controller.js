const electron = require('electron');
const url = require('url');
const path = require('path');
const { BrowserWindow, Menu, app } = electron;

class WindowController {
    constructor(mainWindowWidth = 1024, mainWindowHeight = 768) {
        this.loginWindow;
        this.mainWindow;
        this.detailWindows = new Set();
        this.mainWindowWidth = mainWindowWidth;
        this.mainWindowHeight = mainWindowHeight;
    }
    
    // creates the main application window and starts the user at the login page.
    createMainWindow_Login(){
        this.loginWindow = new BrowserWindow({
            width: this.mainWindowWidth,
            height: this.mainWindowHeight,
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.loginWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../view/loginWindow.html'),
            protocol: 'file:',
            slashes: true
        }));

        // Quit app when closed
        this.loginWindow.on('closed', function () {
            app.quit();
        });
    }


    // TODO implement shared window creation function to avoid duplicated code
    //createWindow(height, width){ return new BrowserWindow}


    createMainWindow() {
        // create new window
        this.mainWindow = new BrowserWindow({
            width: this.mainWindowWidth,
            height: this.mainWindowHeight,
            // TODO Implement secure solution https://stackoverflow.com/a/57049268
            // Solves Uncaught ReferenceError: 'require' is not defined
            webPreferences: {
                nodeIntegration: true
            }
        });
        // load html into window
        this.mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../view/mainWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
        // Quit app when closed
        this.mainWindow.on('closed', function () {
            app.quit();
        });
        // Set window size
        //this.mainWindow.setSize(this.mainWindowWidth, this.mainWindowHeight);

        // Build menu from template
        const mainMenu = Menu.buildFromTemplate(getMenuTemplate());
        // Insert menu
        Menu.setApplicationMenu(mainMenu);
    }

    createDetailWindow(projectEntry) {
        // create new window with dimensions 3/4 size of main window
        let detailWindow = new BrowserWindow({
            width: this.mainWindowWidth / 4 * 3,
            height: this.mainWindowHeight / 4 * 3,
            title: projectEntry.projectName + ' - DAW Buddy',
            // TODO Implement secure solution https://stackoverflow.com/a/57049268
            // Solves Uncaught ReferenceError: 'require' is not defined
            webPreferences: {
                nodeIntegration: true
            }
        });
        // send project details object to detail window
        detailWindow.project = projectEntry;
        // load html into window
        detailWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../view/detailWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
        
        detailWindow.on('close', _ => {
            //this.deleteDetailWindow(detailWindow);
            this.detailWindows.delete(detailWindow);
            detailWindow = null;
        });
        this.detailWindows.add(detailWindow);
    }
}

module.exports = WindowController



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

