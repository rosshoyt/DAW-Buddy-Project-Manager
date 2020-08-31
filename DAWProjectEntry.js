class DAWProjectEntry {
    constructor(){
        this.fullPath = 'unset';
        this.directoryCreated = 'unset';
        this.dawType = 'unset';
        this.projectName = 'unset';
        this.projectFiles = [];
        this.subFolders = [];
        this.mediaFiles = [];
        this.miscFiles = [];
        this.totalBytes = 0.0;
        this.totalFiles = 0;
    }
}
module.exports = DAWProjectEntry