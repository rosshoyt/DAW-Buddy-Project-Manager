const StringUtils = require('../common/string-utils');
const AdvancedArray = require('../common/advanced-array');
// TODO implement class -
class TableManager {
    TableManager(activeColumnsList) {
        setActiveColumnsList(activeColumnsList);
    }
    setActiveColumnsList(activeColumnsList){
        this.activeColumnsList = activeColumnsList;
    }    
}


function createRow(audioFile, tableID) {
    var tableRef = document.getElementById(tableID).getElementsByTagName('tbody')[0];

   
    // Insert a row at the end of the table
    var newRow = tableRef.insertRow(-1);
    newRow.id = audioFile.fullPath;

    // TODO
    // var col = [];
    // for (var i = 0; i < myBooks.length; i++) {
    //     for (var key in myBooks[i]) {
    //         if (col.indexOf(key) === -1) {
    //             col.push(key);
    //         }
    //     }
    // }
    // for (const prop in audioFile) {
    // }


    // Append a text node to the cell
    var audioFileName = document.createTextNode(audioFile.fileName);
    var dateCreated = document.createTextNode(audioFile.timeCreated);
    var fileType = document.createTextNode(audioFile.extension);
    var sizeBytes = document.createTextNode(getReadableFileSizeString(audioFile.byteSize));
    //var numProjFiles = document.createTextNode(project.dawFiles.length);
    var favoriteIcon = document.createTextNode(audioFile.isFavorite ? "star" : "star_border");

    // create an element to hold the 'favorite' star icon
    var isFavorite = document.createElement("i"); //
    isFavorite.classList.add("material-icons");
    isFavorite.appendChild(favoriteIcon);
    isFavorite.addEventListener('click', toggleFavorite);
    //isFavorite.addEventListener('dblclick', function(){});

    // Insert a cell in the row at index 0
    var cell1 = newRow.insertCell(0);
    var cell2 = newRow.insertCell(1);
    var cell3 = newRow.insertCell(2);
    var cell4 = newRow.insertCell(3);
    var cell5 = newRow.insertCell(4);

    cell1.appendChild(audioFileName);
    cell2.appendChild(dateCreated);
    cell3.appendChild(fileType);
    //cell3.appendChild(numProjFiles);
    cell4.appendChild(sizeBytes);
    cell5.appendChild(isFavorite);

}
module.exports = { createRow }

//function 