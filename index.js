const express = require('express');
const socket = require('socket.io');
const http = require('http');
const {Chess}=require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess =new Chess();
let players={};
let currentPlayer= "w";

app.use(express.static(path.join(__dirname,"public")));
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs'); 

app.get('/', function(req, res){
    res.render('index');   
})

io.on("connection", function(uniquesocket){
    console.log("connected");
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }else{
        uniquesocket.emit("spectatorRole")
    }

    uniquesocket.on("disconnect",function(){
        if(players.white==uniquesocket.id){
            players.white=null;
        }else if(players.black==uniquesocket.id){
            players.black=null;
        } 
    })

    uniquesocket.on("move",(move)=>{
        try {
            if(chess.turn() == 'w' && uniquesocket.id !== players.white) {
                uniquesocket.emit("whiteMove",function(){
                    console.log("return at white");
                    return;
                })
            };
            if(chess.turn() == 'b' && uniquesocket.id !== players.black) {
                uniquesocket.emit("blackMove",function(){
                    console.log("return at black");
                    return;
                })
            };
            
            const result=chess.move(move);
            if(result){
                currentPlayer=chess.turn();
                io.emit("move",move)
                io.emit("boadState",chess.fen())
                if(chess.turn() == "w"){
                    uniquesocket.emit("whiteMove")
                }else if(chess.turn() == "b"){
                    uniquesocket.emit("blackMove")
                }
            }else{
                console.log("invalid move",move)
                uniquesocket.emit("invalidMove",move)
            }
        } catch (error) {
            console.log(error);
            uniquesocket.emit("invalidMove",move)
        }
    })
})

server.listen(3000,function(){
    console.log("Server is running on port 3000")}); 