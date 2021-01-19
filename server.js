const express = require('express')
const socketIO = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server,{
    cors:{
        origin: '*',
        methods:['GET'],
        credentials: true
    }
});
const PORT = process.env.PORT || 5000;

const router = require('./router');

io.on('connection',(socket)=>{
    console.log("had a connection");
    // handle client join room
    socket.on('join',({name,room},cb)=>{
        console.log(name,room);
        socket.name = name;
        socket.room = room;
        socket.choice = null;
        if(io.sockets.adapter.rooms.get(room)){
            if(io.sockets.adapter.rooms.get(room).size <2){
                // client second connected
                socket.to(room).emit('otherjoin',{name});
                //console.log(io.sockets.adapter.rooms);
                //console.log(io.sockets.adapter.rooms.get(room).size);
                const roomJoin =io.sockets.adapter.rooms.get(room); 
                //console.log(io.sockets.adapter.rooms.get(room).keys().next().value);
                
                const idSocket = roomJoin.keys().next().value;
                cb({name:io.sockets.sockets.get(idSocket).name});
                socket.join(room);
                socket.to(room).emit('otherjoin',{name1:io.sockets.sockets.get(idSocket).name,name});
                //console.log(socket.id);
                
                
            }else cb({error:'Room full !!!'});
            
        }else socket.join(room);
        // handle game
        socket.on('play',(choice)=>{
            console.log(choice);
            socket.choice = choice;
            
            // th 1: player with computer 
            //check size room  
            if(io.sockets.adapter.rooms.get(socket.room).size === 1 ){
                //size =1 => random rock,paper,scissors => send to client
                const numRand = Math.floor(Math.random() * 11);
                let randomChoice = 'paper';
                if(numRand%3==0){
                    randomChoice = 'rock';
                }else if(randomChoice%3==1){
                    randomChoice = 'paper';
                }else randomChoice = 'scissors';
                
                socket.emit('gamestart',{choiceOne:socket.choice,choiceTwo:randomChoice});
            }else if(io.sockets.adapter.rooms.get(socket.room).size === 2 ){
                //size =2 => check two player choosen or not ? => send to client
                //const sk1 =io.sockets.sockets.get(io.sockets.adapter.rooms.get(room).keys().next().value).choice ;
                //const sk2 =io.sockets.sockets.get(io.sockets.adapter.rooms.get(room).keys().next().next().value).choice ;
                const iterator = io.sockets.adapter.rooms.get(room).keys()
                const sk1 = iterator.next().value;
                const sk2 = iterator.next().value;
                //const sk2 =io.sockets.sockets.get(io.sockets.adapter.rooms.get(room).keys().next().next().value).choice ;

                console.log(sk1+"-"+sk2);
                if(sk1 == socket.id){
                    const choiother = io.sockets.sockets.get(sk2).choice;
                    if(choiother!=null){
                        socket.emit('gamestart',{choiceOne:socket.choice,choiceTwo:choiother});
                        socket.to(room).emit('gamestart',{choiceOne:choiother,choiceTwo:socket.choice});
                        // reset
                        socket.choice = null;
                        io.sockets.sockets.get(sk2).choice = null;
                    }
                }else if(sk2== socket.id){
                    const choiother = io.sockets.sockets.get(sk1).choice;
                    if(choiother!=null){
                        socket.emit('gamestart',{choiceOne:socket.choice,choiceTwo:choiother});
                        socket.to(room).emit('gamestart',{choiceOne:choiother,choiceTwo:socket.choice});
                        //reset
                        socket.choice=null;
                        io.sockets.sockets.get(sk1).choice=null;
                    }
                }
                
            }
        })
    })

    socket.on('disconnect',()=>{
        if(io.sockets.adapter.rooms.get(socket.room))
        if(io.sockets.adapter.rooms.get(socket.room).size >= 1){
            socket.to(socket.room).emit("left",{
                name1:socket.name,
                name2:io.sockets.sockets.get(io.sockets.adapter.rooms.get(socket.room).keys().next().value).name
            });
        }
        
        console.log('one user left');
    })
})
app.use(cors());
app.use(router);

server.listen(PORT, ()=>{
    console.log("server is running ...");
})