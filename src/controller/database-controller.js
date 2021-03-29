const electron = require('electron');
const Store = require('electron-store');
const { app, ipcMain } = electron;
const { shell } = require('electron');

class DatabaseController {
    constructor(){
        this.store = new Store();
    }

    readProject(projectID){
        return this.store.get(projectID);
    }

    createProject(projectID, project){
        this.store.set(projectID, project);
    }
}

module.exports = { DatabaseController }

