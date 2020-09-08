// base object class which contains all information about a unique 
// digital audio workstation project
class DAWProjectEntry {
    constructor(name){
        this.projectName = name;
        this.dawType = 'unset';
        this.dir = {};
        this.totalBytes = 0.0;
        this.totalFiles = 0;
        this.dawFiles = [];
        this.audioFiles = [];
        this.videoFiles = [];
        this.uncatFiles = []; // Uncategorized files
        this.isFavorite = false;
    }
}
module.exports = DAWProjectEntry
