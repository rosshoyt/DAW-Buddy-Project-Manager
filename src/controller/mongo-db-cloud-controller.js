const MongoClient = require('mongodb').MongoClient;


// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

class MongoDBCloudController{

  constructor(){
    this.client = new MongoClient(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    // this.collection;
    // this.db;

    //this.openConnection();
    this.run();
  }

  openConnection(){
    this.client.connect(err => {
      console.log("mongodb - connection result (null = successfull): " + err);
      this.db = this.client.db("Cluster0");//.collection("devices");

      console.log("mongodb - collection name: " + this.collection.collectionName);
      // perform actions on the collection object
    });
  }

  async run(){
    try {
      await this.client.connect();
      console.log("Connected correctly to server");
      const db = this.client.db("Cluster0");
      // Use the collection "people"
      const col = db.collection("people");
      // Construct a document                                                                                                                                                              
      let personDocument = {
          "name": { "first": "Alan", "last": "Turing" },
          "birth": new Date(1912, 5, 23), // June 23, 1912                                                                                                                                 
          "death": new Date(1954, 5, 7),  // June 7, 1954                                                                                                                                  
          "contribs": [ "Turing machine", "Turing test", "Turingery" ],
          "views": 1250000
      }
      // Insert a single document, wait for promise so we can read it back
      const p = await col.insertOne(personDocument);
      // Find one document
      const myDoc = await col.findOne();
      // Print to the console
      console.log(myDoc);
     } catch (err) {
      console.log(err.stack);
    }
  }


  closeConnection(){
    this.client.close();
  }
  
  // writeData(data){
  //   this.client.
  // }
}
module.exports = MongoDBCloudController