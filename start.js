import http from "http";
import { Server } from "socket.io";
import mysql from "mysql-await"
import fs from "fs"
import express from "express";
import axios from "axios";
import FormData from 'form-data'
const connection = mysql.createConnection(JSON.parse(fs.readFileSync('./conexaoConfig.json')));
const app = express()
app.use(express.json())
connection.on(`error`, (err) => {
  console.error(`Connection error ${err.code}`);
});
let textos = []
//let result = await connection.awaitQuery('show tables');
//connection.awaitEnd();
//console.log(result)
let port = 5002
let host = '127.0.0.1'
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3002",
      "http://localhost:4000",
      "http://192.168.2.128:3002",
      "http://192.168.2.128:4000",
      "http://192.168.2.128:5500",
      "http://localhost:5500"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});
io.on("connection", async (Client) => {
  console.log(Client.id)
  Client.on("keypress", (arg) => {
    console.log(arg.replace('key', '')); // world
  });
  Client.on("send", dados => {
    textos.push(dados)
    io.emit("historico", textos)
  })
  Client.on("Getdados", async dados => {
    
    console.log(dados.idEmpresa)
    console.log(dados.dados?.messages[0]?.message)
    console.log(dados.dados?.messages[0]?.key)
    console.log(dados.dados)
    const { messages } = dados.dados
    if(messages[0]?.key?.fromMe === true){

     // console.log('partiu de min')
      return 
    }else{
      
 //console.log(messages)
 console.log(messages)
 console.log(Client.id)
 console.log(messages[0]?.key?.remoteJid)
 console.log(messages[0]?.pushName)
 console.log(messages[0]?.message?.extendedTextMessage?.text)
 console.log('----------')
 console.log(messages[0]?.message?.locationMessage)
 console.log(messages[0]?.message?.locationMessage?.degreesLatitude)
 console.log(messages[0]?.message?.locationMessage?.degreesLongitude)
 console.log('----------')
 console.log(messages[0]?.message?.audioMessage)
 console.log('----------')
 console.log(messages[0]?.message?.audioMessage)
 console.log('----------')
}
  
  let ret =  await Authorization()
  
  let tokenAtualConectado = ret?.access_token
  console.log(tokenAtualConectado)
  if(messages[0]?.key?.remoteJid != 'status@broadcast'){
    await SetmensagensRecebidas(messages[0]?.key?.remoteJid,tokenAtualConectado,dados.idEmpresa,messages[0]?.message)
    await  updateTokeEmpresa(messages[0]?.key?.id,tokenAtualConectado,dados.idEmpresa,Client.id)
  }
  if (messages[0]?.message?.extendedTextMessage?.text != undefined) {
    console.log("Verificar frase")
    let frase = messages[0]?.message?.extendedTextMessage?.text
      frase = frase.toUpperCase()
    if(frase.indexOf('?') != -1){
      frase = frase.replaceAll('?','')
    }
    frase = frase.split(' ')
    console.log(frase)
    let palavras = ''
    for (let index = 0; index < frase.length; index++) {
      if (index + 1 == frase.length) {
        palavras += `${frase[index]}`
      } else {
        palavras += `${frase[index]},`
      }
    }
    console.log([palavras,tokenAtualConectado])

    let retornodados = await GetPerguntaResposta(palavras,tokenAtualConectado,dados.idEmpresa)
        
          console.log(retornodados)
          console.log("************* AQUI ****************")
          if(retornodados?.message != 'não encontrado'){
          let pountuacao = 0.0
          let tipoResposta = []
          let PalavraChave = []
          var arrayretonro = Object.keys(retornodados).map(i => retornodados[Number(i)]);

          for (let index = 0; index < arrayretonro.length; index++) {
            console.log(arrayretonro[index]?.pontuacao)
            tipoResposta.push(arrayretonro[index]?.tipoResposta)
            PalavraChave.push(arrayretonro[index]?.PalavraChave)
            pountuacao + parseFloat(arrayretonro[index]?.pontuacao); 
          }

          console.log("///////////////")
          console.log(tipoResposta)
          let dadtahora = new Date()
          let hora = dadtahora.getHours()
            console.log(hora)
            console.log('--------------')

            let mensagemDeRedirecionamento = await getMensagensDeRedirecionamento(retornodados[0].tipoResposta,tokenAtualConectado,dados.idEmpresa,messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''))

            console.log(mensagemDeRedirecionamento)


            if(mensagemDeRedirecionamento?.message == 'sucesso'){
              let dadtahora = new Date()
              let hora = dadtahora.getHours()
              console.log(hora)
              let dadosempresa  = await GetDadosEmpresa(messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),tokenAtualConectado,dados.idEmpresa)
              console.log(dadosempresa)

            

              let jsonGerado = {
                "receiver":messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),
                "message": mensagemDeRedirecionamento?.jsonEnvio.mensagem,
                "Horario":hora
              }

             return Client.emit("Send",jsonGerado)

            }else{
              let jsonGerado = {
                "receiver":messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),
                "message": {
                  "text": retornodados[0].tipoResposta +' pontuação da frase '+ pountuacao +' '+ tipoResposta +' '+frase.length,
                },
              "Horario":hora
              }
              console.log(jsonGerado)
             return  Client.emit("Send",jsonGerado) 
            }
         
            
            
          }else{
            let dadtahora = new Date()
          let hora = dadtahora.getHours()
            console.log(hora)
            Client.emit("Send",{
              "receiver":messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),
              "message": {
                "text": "Não consegui compreender  ",
              },
            "Horario":hora
          })
          }
        
    
    
  }
  if (messages[0]?.message?.conversation != undefined) {
    console.log("Verificar frase")
    let frase = messages[0]?.message?.conversation
      frase = frase.toUpperCase()
    if(frase.indexOf('?') != -1){
      frase = frase.replaceAll('?','')
    }
    frase = frase.split(' ')
    console.log(frase)
    let palavras = ''
    for (let index = 0; index < frase.length; index++) {
      if (index + 1 == frase.length) {
        palavras += `${frase[index]}`
      } else {
        palavras += `${frase[index]},`
      }
    }
    console.log([palavras,tokenAtualConectado])

    let retornodados = await GetPerguntaResposta(palavras,tokenAtualConectado,dados.idEmpresa)
        
          console.log(retornodados)
          if(retornodados?.message != 'não encontrado'){
          let pountuacao = 0.0
          let tipoResposta = []
          let PalavraChave = []
          var arrayretonro = Object.keys(retornodados).map(i => retornodados[Number(i)]);

          for (let index = 0; index < arrayretonro.length; index++) {
            console.log(arrayretonro[index]?.pontuacao)
            tipoResposta.push(arrayretonro[index]?.tipoResposta)
            PalavraChave.push(arrayretonro[index]?.PalavraChave)
            pountuacao + parseFloat(arrayretonro[index]?.pontuacao); 
          }

          console.log("///////////////")
          console.log(tipoResposta)
          let dadtahora = new Date()
          let hora = dadtahora.getHours()
            console.log(hora)
            console.log('--------------')

            let mensagemDeRedirecionamento = await getMensagensDeRedirecionamento(retornodados[0].tipoResposta,tokenAtualConectado,dados.idEmpresa,messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''))

            console.log(mensagemDeRedirecionamento)


            if(mensagemDeRedirecionamento?.message == 'sucesso'){
              let dadtahora = new Date()
              let hora = dadtahora.getHours()
              console.log(hora)
              let dadosempresa  = await GetDadosEmpresa(messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),tokenAtualConectado,dados.idEmpresa)
              console.log(dadosempresa)

            

              let jsonGerado = {
                "receiver":messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),
                "message": mensagemDeRedirecionamento?.jsonEnvio.mensagem,
                "Horario":hora
              }

             return Client.emit("Send",jsonGerado)

            }else{
              let jsonGerado = {
                "receiver":messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),
                "message": {
                  "text": retornodados[0].tipoResposta +' pontuação da frase '+ pountuacao +' '+ tipoResposta +' '+frase.length,
                },
              "Horario":hora
              }
              console.log(jsonGerado)
             return  Client.emit("Send",jsonGerado) 
            }
         
            
            
          }else{
            let dadtahora = new Date()
          let hora = dadtahora.getHours()
            console.log(hora)
            Client.emit("Send",{
              "receiver":messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),
              "message": {
                "text": "Não consegui compreender sua mensagem \n\r  *Opções* *disponiveis* \n\r ver cardapio , \n\r Calcular taxa de entrega  ",
              },
            "Horario":hora
          })
          }
        
    
  }
  if(messages[0]?.message?.locationMessage?.degreesLatitude){
    let  form = new FormData();
    form.append("Lat", `${messages[0]?.message?.locationMessage?.degreesLatitude}`);
    form.append("Lng", `${messages[0]?.message?.locationMessage?.degreesLongitude}`);
    const options = {
      method: 'POST',
      url: 'https://api.mistercheff.com.br/v1/LocaisEntrega',
      headers: {
        'Content-Type': 'multipart/form-data',
        Token: dados.idEmpresa,
        Authorization: 'Bearer '+tokenAtualConectado,
        'content-type': 'multipart/form-data; boundary=---011000010111000001101001'
      },
      data: form
    };
   await axios.request(options).then(function (response) {
      console.log(response.data);
      if(response.data?.entrega == "disponivel"){
        Client.emit("Send",{
          "receiver":messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),
          "message": {
            "text": `Entrega  *${response.data.entrega}* para sua localização \n\r 
              Valor :R$ ${response.data.valor} \n\r 
              Tempo estimado: ${response.data.tempo} minutos `
            },
          "Horario":""
        });
      }else{
        Client.emit("Send",{
          "receiver":messages[0]?.key?.remoteJid.replace('@s.whatsapp.net',''),
          "message": {
            "text": `Entrega  *Indisponível* para sua localização  `
            },
          "Horario":""
        });
      }
    }).catch(function (error) {
      console.error(error);
    });

//      let entregaem = await getLocaisEntrega()
     
    //REtornar DAdos localização 
  }
  })
  Client.on("Login", async dados =>{
      console.log(dados)
        await FunctLogin(dados).then(
          (ret)=>{
            let access_token = {ret}
            if(access_token != undefined){
              Client.emit('ResponseLogin',access_token)
           
            }else{
              let erro = {"erro":"erro ao autenticar"}          
              Client.emit('ResponseLogin',erro)
            }
          }
        )
  } )
  })

const FunctLogin = async (dados)=>{
 let ret =  await Authorization(dados.token)
  return ret
}
app.get('/', (req, res) => {
  res.send('Soket tuor drive rodando')
})
httpServer.listen(port, host, () => {
  console.log(`Server is listening on http://${host}:${port}`)
});


