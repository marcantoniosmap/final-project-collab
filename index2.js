const mongodb = require('mongodb');
const ShareDB = require('sharedb');
const ShareDbMongo = require('sharedb-mongo');
var expect = require('chai').expect;
var getQuery = require('sharedb-mingo-memory/get-query');



const mongoUrl = 'mongodb+srv://adminmarc:yGlabn12@cluster0-luwgd.mongodb.net/ShareDB?retryWrites=true&w=majority';

var db = new ShareDbMongo(mongoUrl,{ useUnifiedTopology: true });
  
db.getCollection = function(collectionName, callback) {
  // Check the collection name
  var err = this.validateCollectionName(collectionName);
  if (err) return callback(err);
  // Gotcha: calls back sync if connected or async if not
  this.getDbs(function(err, mongo) {
    if (err) return callback(err);
    var collection = mongo.collection(collectionName);
    return callback(null, collection);
  });
};

db.getCollection('project',(err,collection)=>{
    if(err){
        console.log('error=',err);
    }else{
        console.log(collection);
    }
});

db._connect = function(mongo, options) {
    // Create the mongo connection client connections if needed
    //
    // Throw errors in this function if we fail to connect, since we aren't
    // implementing a way to retry
    var self = this;
    var mongoPoll = options.mongoPoll;
    if (mongoPoll) {
      var tasks = {
        mongoClient: (typeof mongo === 'function') ? mongo : function(parallelCb) {
          mongodb.connect(mongo, options.mongoOptions, parallelCb);
        },
        mongoPollClient: (typeof mongoPoll === 'function') ? mongoPoll : function(parallelCb) {
          mongodb.connect(mongoPoll, options.mongoPollOptions, parallelCb);
        }
      };
      async.parallel(tasks, function(err, results) {
        if (err) throw err;
        var mongoClient = results.mongoClient;
        var mongoPollClient = results.mongoPollClient;
        if (isLegacyMongoClient(mongoClient)) {
          self.mongo = self._mongoClient = mongoClient;
          self.mongoPoll = self._mongoPollClient = mongoPollClient;
        } else {
          self.mongo = mongoClient.db();
          self._mongoClient = mongoClient;
          self.mongoPoll = mongoPollClient.db();
          self._mongoPollClient = mongoPollClient;
        }
        self._flushPendingConnect();
      });
      return;
    }
    var finish = function(err, client) {
      if (err) throw err;
      if (isLegacyMongoClient(client)) {
        self.mongo = self._mongoClient = client;
      } else {
        self.mongo = client.db();
        self._mongoClient = client;
      }
      self._flushPendingConnect();
    };
    if (typeof mongo === 'function') {
      mongo(finish);
      return;
    }
    // TODO: Don't pass options directly to mongodb.connect();
    // only pass options.mongoOptions
    var mongoOptions = options.mongoOptions || options;
    mongodb.connect(mongo, mongoOptions, finish);
  };

