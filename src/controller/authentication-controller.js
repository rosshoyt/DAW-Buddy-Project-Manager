// simple class which processes login attempts
// and tracks userID of the logged in user
class AuthenticationController {
    constructor(){
        this.currentUserID = null;
    }

    tryLogin(userID, userPassword){
        // TODO implement: authenticate provided data etc
        
        this.currentUserID = userID;    
        return true;
    }

    getCurrentUserID(){
        return this.currentUserID;
    }

}
module.exports = AuthenticationController