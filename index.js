const http = require('http');
const express = require('express');
const app = express();
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const ShareDB = require('sharedb');
const cors= require('cors');

// var ShareDBMingo = require('sharedb-mingo-memory');
// var db = new ShareDBMingo();

app.use(express.json());
app.use(cors());
dotenv.config();

const mongodb = require('mongodb');
const db = require('sharedb-mongo')({mongo: function(callback) {
    mongodb.connect(process.env.DB_CONNECTION, { useUnifiedTopology: true, }, callback);
}});

const share = new ShareDB({ db });
// const share = new ShareDB();
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
// const ShareDBMingoMemory = require('sharedb-mingo-memory');


// temporary react base template for sharedb
const fs = require('fs');
var raw_data = fs.readFileSync('reactTemplate.json');
var temp_data = JSON.parse(raw_data);

var raw_data = fs.readFileSync('tempJ.json');
var temp_json = JSON.parse(raw_data);

const GETPROJECTURL ='https://project.cogether.me/api/project/read/'

// const share = new ShareDB({db}); // insert ShareDBMingoMemory later
const server = http.createServer(app); const wss = new WebSocket.Server({ server: server })

const port = process.env.PORT || 9000

server.listen(port);

function getFile(content) {
    const dic = {};
    for (let i = 0; i < content.length; i++) {
        try {
            dic[content[i].filename] = { code: content[i].code };
        } catch (err) {
            dic[content[i].filename] = { code: '' };
        }
    }
    return dic;
}




// console.log(temp_data);
function replaceDots(content) {
    const dic = {};
    for (var key in content) {
        // console.log(key.replace('.', '!^%!@'))
    }
}
function reverseDots(content) {
    const dic = {};
    for (var key in content) {
        // console.log(key.replace('!^%!@', '.'))
        // console.log(content[key]);
    }
}
temp_file = getFile(temp_data)

var test = replaceDots(temp_file);
var test2 = reverseDots(test);


// connect any incoming websocket connection
wss.on('connection', function(ws){
    var stream = new WebSocketJSONStream(ws);
    share.listen(stream);
});

var connection = share.connect();
var doc = connection.get('project', 'test1');
doc.fetch(function (err) {
    if (err) throw err;
    if (doc.type === null) {
        temp_file = getFile(temp_data);
        // console.log(temp_json[0]);
        doc.create(temp_json[0]); // shareDB cant use nested JSON }
        // console.log(doc.data);
    }
}
);

function transformJson(content) {
    var dic = {};
    for (var i = 0; i < content['file_idx'].length; i++) {
        dic[content['file_idx'][i]] = {"code": content['code'][i]};
    }
    return dic;
}

var new_dic = transformJson(temp_json[0]);
// console.log(new_dic);
// console.log(temp_json[0]['code'][0])













app.get('/',async (req,res)=>{
    const anjeng = await db.getCollection('project',function(err,collection){
        try{
            console.log(collection);
            res.send({collection:collection});
        }catch(err){
            res.send({err:err});
        }
    });
    // const response= share.collection.count();

});

app.get('/getFromShareDB/:id', async (req, res) => {
    const project_id = req.params.id;
    const getProject = async (url, token) => {
        try {
            const project = await fetch(url,
                {
                    method: 'GET', headers: {
                        "Content-Type": 'application/json',
                        "auth-token": token
                    }
                });
            const json = await project.json();
            return json;
        } catch (err) {
            return err;
        }
    }
    try {
        const response = await getProject(GETPROJECTURL + req.params.id, req.header('auth-token'));
        res.send(response);
    } catch (err) {
        res.send({ err: err });
    }
    // if (project_id ){}

    // connection.createFetchQuery(project_id, {}, {}, function (err, results) {
    //     if (err) throw err;
    //     if (results.length === 0) { // fetch document from project API
    //         res.status(200).send(response);
    //         response.source.forEach(file => {
    //             var doc = connection.get(project_id, file.filename);
    //             doc.create(file, function (err) {
    //                 if (err) throw err;
    //             });
    //         });

    //     }
    // });
});

// initial document
// connection.createFetchQuery('project', {}, {}, function(err, results) {
//     if (err) throw err;
//     if (results.length === 0) { // create initial data (?)
//         temp_data.forEach(file => {
//             var doc = connection.get('project', file.filename);
//             doc.create(file, function(err) {
//                 if (err) throw err;
//             });
//         });
//     }
// });

// projectID
// Index.js
// UserList.js