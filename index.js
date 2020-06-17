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

// MONGODB CONNECTION
const mongodb = require('mongodb');
const db = require('sharedb-mongo')({mongo: function(callback) {
    mongodb.connect('mongodb+srv://adminmarc:yGlabn12@cluster0-luwgd.mongodb.net/ShareDB?retryWrites=true&w=majority', { useUnifiedTopology: true, }, callback);
}});

const share = new ShareDB({ db });
// const share = new ShareDB();
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');

dotenv.config();

// temporary react base template for sharedb
const fs = require('fs');
const { response } = require('express');
// REACT TEMPLATE
var raw_data = fs.readFileSync('reactTemplate.json');
var temp_data = JSON.parse(raw_data);
// SHAREDB TEMPLATE
var raw_data = fs.readFileSync('tempJ.json');
var temp_json = JSON.parse(raw_data);

const GETPROJECTURL ='https://project.cogether.me/api/project/read/'

// const share = new ShareDB({db}); // insert ShareDBMingoMemory later
const server = http.createServer(app); 
const wss = new WebSocket.Server({ server: server, allowed_origins: '*' })

server.listen(9001);

// transforms reactTemplate to sandpack
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

// sandpack file
temp_file = getFile(temp_data)

// connect any incoming websocket connection
wss.on('connection', function(ws){
    var stream = new WebSocketJSONStream(ws);
    share.listen(stream);
});

var connection = share.connect();

// transforms sharedb file to sandpack 
function transformJson(content) {
    var dic = {};
    for (var i = 0; i < content['file_idx'].length; i++) {
        dic[content['file_idx'][i]] = {"code": content['code'][i]};
    }
    return dic;
}

app.get('/getFromShareDB/:id', async (req, res) => {
    // gets project details from project backend
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
        // console.log(response);
        // console.log("AAAA");
        var doc = connection.get('cogether', req.params.id);
        doc.subscribe(function(err) {
            if (err) throw err;
        });

        // console.log("REFETCHED");
        if (doc === null) { // project does not exist in sharedb
            var share_data = convert2(response.source)
            console.log(share_data);
            doc.create(share_data); // sharedb file
            // console.log(doc.data)
            console.log("NEW DOC");
            return res.send(response); // since the codes are the same
        } else {

            // // use old JSON format but take files from doc.data; convert doc.data to oldJSON
            // // doc.data => reactTemplate 
            console.log(doc.data); // ga ngeload
            var new_response = convert1(doc.data, response.source);
            // console.log(doc.data);
            // console.log(new_response);
            response.source = new_response;
            // console.log(response);
            console.log("OLD DOC");

            doc.destroy();

            return res.send(response);
        }
        } catch (err) {
            res.status(400).send({ err: err });
        }
});


// doc.data => reactTemplate
function convert1(content, react_temp) {
    dic = []
    for (let index = 0; index < content[0]['code'].length; index++) {
        react_temp[index]['filename'] = content[0]['file_idx'][index];
        react_temp[index]['code'] = content[0]['code'][index];
    }
    return react_temp
}

// var react_temp = convert1(temp_json, temp_data);

// reactTemplate => doc.data
function convert2(content) {
    dic = [
        {
            "code": [],
            "file_idx": []
        }
    ]
    for (let index = 0; index < content.length; index++) {
        var filename = (content[index]['filename']);
        var code = (content[index]['code']);
        dic[0]['file_idx'].push(filename);
        dic[0]['code'].push(code);
    }
    return dic
}
// var doc_data = convert2(temp_data);