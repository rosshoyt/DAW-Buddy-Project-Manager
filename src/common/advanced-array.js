// Wrapper class which provides additional functionality to the JS Array class
class AdvancedArray extends Array {
    //function which returns index of item with nested property in JS array, or -1 if not found
    // TODO optimize
    indexOfObjectWithNestedProp (properties,value) {
        for (var i = 0, len = this.length; i < len; i++) {
            if (properties.length > 0) {
                // get initial object
                var nestedObj = this[i][properties[0]];
                // iterate to nested object
                for (var j = 1, propLen = properties.length; j < propLen; j++)
                    nestedObj = nestedObj[properties[j]];
                if (nestedObj === value) return i;
            }
        }
        return -1;
    }

    // function which returns index of item in JS array, or -1 if not found
    indexOfObject(property, value) {
        for (var i = 0, len = this.length; i < len; i++) {
            if (this[i][property] === value) return i;
        }
        return -1;
    }
}
module.exports = AdvancedArray
