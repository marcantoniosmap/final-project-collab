const http = require('http');
const express = require('express');
const app = express();
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const ShareDB = require('sharedb');
const cors = require('cors');

app.use(express.json());
app.use(cors());

// MONGODB CONNECTION
const mongodb = require('mongodb');
const db = require('sharedb-mongo')({
    mongo: function (callback) {
        mongodb.connect('mongodb+srv://adminmarc:yGlabn12@cluster0-luwgd.mongodb.net/ShareDB?retryWrites=true&w=majority', { useUnifiedTopology: true, }, callback);
    }
});

const share = new ShareDB({ db });
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
dotenv.config();

const GETPROJECTURL = 'https://project.cogether.me/api/project/read/'

// const share = new ShareDB({db}); // insert ShareDBMingoMemory later
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server, 'Access-Control-Allow-Origin': '*' })

const port = process.env.PORT || 9001

server.listen(port);

// connect any incoming websocket connection
wss.on('connection', function (ws) {
    var stream = new WebSocketJSONStream(ws);
    share.listen(stream);
});

var connection = share.connect();

app.get('/', async (req, res) => {
    res.send('here');
})

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
        var doc = connection.get('cogether', req.params.id);
        doc.fetch(async function (err) {
            if (err) throw err;
            if (doc.type === null) { // project does not exist in sharedb
                var share_data = convert2(response.source)
                const new_res = await doc.create(share_data); // sharedb file
                console.log(response)
                return res.send(response); // since the codes are the same
            } else {
                var new_response = convert1(doc.data, response.source);
                response.source = new_response;
                doc.destroy();
                return res.send(response);
            }
        });
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