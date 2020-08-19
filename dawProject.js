//var remote = window.require('electron').remote; // TODO need this line?
var electronFs = remote.require('fs');

export default class DawProject {
    constructor(path, folderName = null){
        this.path = path;
        this.folderName = name;
        this.items = [];
    }

    static readDir(path) {
        var dawProjectsArray = [];
        console.log("Reading directory " + path);
        var lastPath = path;
        electronFs.readdirSync(path).forEach(file => {
            //var fileInfo = new FileTree(`${path}\\${file}`, file);
            console.log(file);
            var stat = electronFs.statSync(fileInfo.path);

            if (stat.isDirectory()){
                fileInfo.items = FileTree.readDir(fileInfo.path);
            }

            dawProjectsArray.push(fileInfo);
        })

        return dawProjectsArray;
    }

}
