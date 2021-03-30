const Store = require('electron-store');
const AdvancedArray = require('../common/advanced-array');
const UserSearchDirectories = require('../model/user-search-directories');

// class which manages the local electron-store database
class DatabaseController {
    
    constructor(){
        this.store = new Store();
        this.USER_SEARCH_DIRECTORIES_ID = "1819046283746"; // temporary key for user search directories 
    }

    // method that adds a full path string to the user's list of search directories
    // @var dir - full path string
    addUserSearchDirectory(dir){
        this.createOrUpdateUserSearchDirectories(dir);
    }

    // tries to read the database entry for user
    readUserSearchDirectories(){
        return this.store.get(this.USER_SEARCH_DIRECTORIES_ID);
    }

    createOrUpdateUserSearchDirectories(searchDirectory){
        var userSearchDirectories;
        // check if the entry exists already
        if(!this.store.has(this.USER_SEARCH_DIRECTORIES_ID)){
            // it hasn't been added yet, so we'll create one            userSearchDirectories = new UserSearchDirectories();
        } else{
            // create copy of the usersearchdirectories entry read from database
            userSearchDirectories = new UserSearchDirectories(this.store.get(this.USER_SEARCH_DIRECTORIES_ID));
        }
        // try to add the path to the user list of search directories if it's not a match
        userSearchDirectories.addDirectoryIfNotExists(searchDirectory);
        
        this.store.set(this.USER_SEARCH_DIRECTORIES_ID, userSearchDirectories);
        
    }

    createUserSearchDirectories(){
        
    }


    readProject(projectID){
        return this.store.get(projectID);
    }

    createProject(projectID, project){
        this.store.set(projectID, project);
    }

}
module.exports = DatabaseController