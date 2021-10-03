// class which holds all data associated with a DAWBuddy user
class UserProfile {
    constructor(obj){
        if(!(obj && Object.assign(this, obj))){
            this.userID = null;
            this.userData = new Map();// TODO store user DAW project data as tree map
        }       
    }

    addSearchDirectoryIfNotExists(searchDir){
        if(!this.userData.has(searchDir)){
            this.userData.set(searchDir, new Map());
        }
    }

    addDAWProject(searchDir, dawProject){
        this.addSearchDirectoryIfNotExists(searchDir);
        this.userData.get(searchDir).set(dawProject.projectName,dawProject);
    }

    getAllSearchDirectories(){
        return Array.from(Object.keys(this.userData));
    }

    getAllDAWProjects(){
        var allProj = new Array();
        for (let [keySearchDir, valProjMap] of this.userData) {
            for(let [keyProjID, valProj] of valProjMap){
                allProj.push(valProj);
            }
            //console.log(key + ' = ' + value)
        }
        return allProj;
    }
}
module.exports = UserProfile