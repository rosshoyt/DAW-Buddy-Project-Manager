const Store = require('electron-store');

module.exports = class DatabaseController {
    constructor(){
        this.store = new Store();
        //console.log(app.getPath('userData'))

    }
    readProject(projectID){
        return this.store.get(projectID);
    }

    createProject(projectID, project){
        this.store.set(projectID, project);
    }
}