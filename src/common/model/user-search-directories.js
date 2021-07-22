// domain class which holds the user's search directories for music projects
class UserSearchDirectories{
    // constructor which can accept an object and create a copy if it has the same properties
    constructor(obj){
        this.directories = [];
        for (var prop in obj) {if (obj.hasOwnProperty(prop)) {this[prop] = obj[prop];}}
    }

    // adds a directory string to the list if it doesn't exist already.
    // TODO Fix this method, string comparison not working
    addDirectoryIfNotExists(addDir){
        var exists = false;
        
        for(var i = 0; i < this.directories.length; i++){
            var dir = this.directories[i];
            console.log("checking if " + addDir + " == " + dir);
            if(addDir === dir){ 
                exists = true;
            }
        }

        //this.directories.some(dir => {
            //console.log("checking if " + addDir + " == " + dir);
            // compare the strings  
        //});

        if(!exists){
            this.directories.push(addDir);
            console.log("Added it, cause it wasn't already in the list!");
        }
    }
}

module.exports = UserSearchDirectories