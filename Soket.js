import express from "express";
import { Server } from "socket.io";
import http from "http";
export const app = express()
export const httpServer = http.createServer(app);
export  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3002",
        "http://localhost:4000",
        "http://192.168.2.128:3002",
        "http://192.168.2.128:4000",
        "http://192.168.2.128:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5500"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(socket.id)
  });
  io.on("dadosCorrida",(dados)=>{
      console.log(dados)
  })

const F ={
    motoristaEncontrado(){
        let dados = {
            nomeMotorista:"Alysson",
            corridas :150,
            avaliacao: 4.5
        }
          io.emit("MotoristaEncontrado",dados ,(ret)=>{
              console.log(ret)
          })
    }
}
  