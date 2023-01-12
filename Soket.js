import express from "express";
import { Server } from "socket.io";
import http from "http";
import https from "https";
export const app = express()
import fs from 'fs'
import axios from "axios";
import {connection} from "./mysqlConexao.js"

export const httpServer = http.createServer({ 
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem') 
}, app);
export  const io = new Server(httpServer, {
    cors: {
      origin: [
       "http://127.0.0.1:5501",
       "http://127.0.0.1:5500",
       "http://tuordriveapp.web.app",
       "http://192.168.2.128:5501",
       "http://192.168.2.128:5500",
       "http://127.0.0.1:5500/",
       "http://192.168.2.103",
       "http://ajdev.ddns.net",
       "http://localhost",
       "http://192.168.2.103:5002"
      ],
      credentials: false,
      maxHttpBufferSize: 1e8
          }
  });

  io.on("connection", (sock) => {
    console.log(sock.id)

    sock.on("dadosCorrida",(dados)=>{
      console.log(dados)
    })

    sock.on("locais_Proximos",async (dados)=>{
      console.log(dados)
      //console.log('Desativado locais proximos')
      //let retorno = 'Desativado locais proximos'
      await F.GetlocaisProximos(dados).then(
        async (retorno)=>{
          console.log('------------------')
          let retur = []
          for (let index = 0; index < retorno.length; index++) {
            let photo = retorno[index]?.photos
            if(photo != undefined){
              let p = await F.PhotoRefence(photo[0].photo_reference)
              retur.push({
                "name":  retorno[index].name,
                "geometry":  retorno[index].geometry.location,
                "opening_hours":  retorno[index]?.opening_hours?.open_now,
                "photo": p,
                "vicinity": retorno[index].vicinity,
                "type": retorno[index].types,
                "rating": retorno[index].rating
              }) 
            }else{
              let p = "./assets/arquivos/img/bg2.jpg"
              retur.push({
                "name":  retorno[index].name,
                "geometry":  retorno[index].geometry.location,
                "opening_hours":  retorno[index]?.opening_hours?.open_now,
                "photo": p,
                "vicinity": retorno[index].vicinity,
                "type": retorno[index].types,
                "rating": retorno[index].rating
              }) 
            }
          }
          //console.log(retur)
          io.in(dados.socketid).emit("locaisProximos_retorno",retur)
        }
      )
      //io.in(dados.sockid).emit("locaisProximos_retorno",retorno)
      
    })

    sock.on("conectado",dados=>{
      console.log("conectado com soket => "+dados)
      
    })

    sock.on("Mensagem",mensagem=>{
      console.log("conectado com soket => "+mensagem)
    })

    sock.on("SendChat", async dados=>{
      //consultarQualo soketDorecebedor Atualmente 
      let query = "SELECT soket FROM `usuario` WHERE id = '"+dados.recebedor+"';"
      console.log(query)
      await connection.awaitQuery(query).then(
        (ret)=>{
          io.in(ret[0].soket).emit("ChatRecebido",dados, async ()=>{
            console.log(ret[0].soket)
             F.RegistrandoMensagemChat(dados)
          })
        }
      ).catch(
        (e)=>{console.log(e)}
      )
      
    })

    sock.on("GetDadosLogado", async dados=>{
      let query = "SELECT * FROM `usuario` WHERE id = '"+dados.id+"'"
      await connection.awaitQuery(query)
       .then((ret)=>( io.in(dados.token).emit("DadosUsuarioLogado",ret)))
       .catch(erro=>(console.log(erro)))
    })

    sock.on("GetDadosLogadoPAssageiro", async dados=>{
      let query = "SELECT * FROM `usuario` WHERE token = '"+dados.id+"'"
      await connection.awaitQuery(query)
       .then((ret)=>( io.in(dados.token).emit("DadosUsuarioLogado",ret)))
       .catch(erro=>(console.log(erro)))
    })

    sock.on("upload", (file, callback) => {
      console.log(file); // <Buffer 25 50 44 ...>
      // save the content to the disk, for example
      writeFile("./tmp/upload", file, (err) => {
        callback({ message: err ? "failure" : "success" });
      });
    });

    sock.on("RegistrandoNome",async (dados)=>{
      let query = "UPDATE `usuario` SET `nome` = '"+dados.nome+"' WHERE `usuario`.`token` = '"+dados.id+"';"
      //console.log(query)
       await connection.awaitQuery(query)

       .then((a)=>( io.in(dados.token).emit("NomeRegistrado"),a))
       .catch(erro=>(console.log(erro)))
    })

    sock.on("RegistrandoEmail",async (dados)=>{
      let query = "UPDATE `usuario` SET `email` = '"+dados.email+"' WHERE `usuario`.`token` = '"+dados.id+"';"
      //console.log(query)
       await connection.awaitQuery(query)

       .then((a)=>( io.in(dados.token).emit("EmailRegistrado"),a))
       .catch(erro=>(console.log(erro)))
    })

    sock.on("RegistrandoLocal",async (dados)=>{
      let query = "UPDATE `usuario` SET `idLatLng_Atual` = '"+dados.idLatLng_Atual+"' WHERE `usuario`.`token` = '"+dados.id+"';"
      console.log(query)
      await connection.awaitQuery(query)
       .then((ret)=>( io.in(dados.token).emit("LocalRegistrado"),ret))
       .catch(erro=>(console.log(erro)))
    })

    sock.on("RegistrandoSenha",async (dados)=>{
      let query = "UPDATE `usuario` SET `senha` = '"+dados.senha+"' WHERE `usuario`.`token` = '"+dados.id+"';"
      //console.log(query)
       await connection.awaitQuery(query)

       .then((a)=>( io.in(dados.token).emit("SenhaRegistrado"),a))
       .catch(erro=>(console.log(erro)))
    })

    //CANCELANDO CORRIDA
    sock.on("CancelarCorridaPassageiro",async (dados)=>{
        console.log(dados)
        let query = "SELECT MotoristaCorridas.id as id FROM `usuario` INNER JOIN MotoristaCorridas  WHERE token = '"+dados.tokenGerado+"'  and MotoristaCorridas.PassageiroID =  usuario.id  ORDER by MotoristaCorridas.id DESC LIMIT 1;"
        console.log(query)
         await connection.awaitQuery(query)
  
         .then( (retornoDados)=>{
          console.log(retornoDados[0].id)
        
               connection.awaitQuery("UPDATE `MotoristaCorridas` SET `dataAceitacao` = CURRENT_TIMESTAMP(), `statusCorrida` = 'Cancelada pelo Passageiro' WHERE `MotoristaCorridas`.`id` = '"+retornoDados[0].id+"';")
        
               .then(
                 ()=>{
                   
                  io.in(dados.token).emit("CorridaCancelada",'',F.CorridaCancelada())
                  
                 }
               ).catch(
                 ()=>{
                  
                  io.in(dados.token).emit("CorridaCancelada",'',F.CorridaCancelada())
                 }
               )
            
          })

         .catch(erro=>(console.log(erro)))
    })
    
    //ACEITARCORRIDA 
    sock.on("CancelarCorridaPassageiroID",async (dados)=>{
      console.log(dados)
      //Aceitando a corrida 
      let query = "UPDATE `MotoristaCorridas` SET `MotoristaID` = NULL, `statusCorrida` = 'Corrida Cancelada pelo PAssageiro', `dataAceitacao` = NULL  WHERE `MotoristaCorridas`.`id`= '"+dados.id+"' "
      console.log(query)
       await connection.awaitQuery(query)
       .then(
            async (a)=>{ 
              console.log(a)
            }
             
       )
       .catch(erro=>(console.log(erro)))

    })
    //ACEITARCORRIDA 
    sock.on("AceitarCorrida",async (dados)=>{
      console.log(dados)
      //Aceitando a corrida 
      let query = "UPDATE `MotoristaCorridas` SET `MotoristaID` = '"+dados.motoristaID+"', `statusCorrida` = 'Aceita', `dataAceitacao` = CURRENT_TIMESTAMP()  WHERE `MotoristaCorridas`.`id`= '"+dados.idcorrida+"';"
      console.log(query)
       await connection.awaitQuery(query)
       .then(
            async (a)=>{ 
              io.in(dados.token).emit("OkCorridaAceita")
              let q = "SELECT soket  FROM `usuario` WHERE `id` = "+dados.passageiroID
              console.log(q)
               await connection.awaitQuery(q)
               .then((t)=>(io.in(t[0].soket).emit("CorridaAceitaPeloMotorista")))
               .catch(erro=>(console.log(erro)))
            }
             
       )
       .catch(erro=>(console.log(erro)))

    })

    sock.on("RegistrandoFotoPerfil",async (dados)=>{
      let query = "UPDATE `usuario` SET `fotoPerfil` = '"+dados.fotoPerfil+"' WHERE `usuario`.`token` = '"+dados.id+"';"
      //console.log(query)
       await connection.awaitQuery(query)

       .then((a)=>( io.in(dados.token).emit("FotoRegistrada"),a))
       .catch(erro=>(console.log(erro)))
    })

    sock.on("loginAnonimo", async(dados)=>{
      console.log(dados, "registrando")
      let query = "INSERT INTO `usuario` (`id`, `nome`, `email`, `token`, `soket`, `statusAtivo`, `senha`, `dataRegistro`, `fotoPerfil`, `tipoUtilizador`, `VeiculoPlaca`, `VeiculoModelo`, `VeiculoAno`, `VeiculoCor`, `MotoristaHabilitacao`, `MotoristaHabilitacaoValidade`, `DataREgistroComoMotorista`) VALUES (NULL, '', '', '"+dados.tokenGerado+"', '"+dados.soketatual+"', '', NULL, CURRENT_TIMESTAMP, '', 'Passageiro', NULL, NULL, NULL, NULL, NULL, NULL, NULL);"
      await connection.awaitQuery(query).then(
        (a)=>{console.log(a)}
      ).catch(
        (e)=>{console.log(e)}
      )
    })

    sock.on("loginMotorista", async(dados)=>{
      console.log(dados)

      let query = "SELECT * FROM `usuario` WHERE email = '"+dados.email+"' AND senha = '"+dados.senha+"' and tipoUtilizador = 'Motorista'"
      await connection.awaitQuery(query).then(
        (ret)=>{
          io.in(dados.token).emit("LoginRespostaMotorista",ret)
        }
      ).catch(
        (erro)=>{console.log(erro)}
      )
    })

    sock.on("AtualizandoToken", async(dados)=>{
      console.log(dados ,'Atualizando')
      let query = "UPDATE `usuario` SET `soket` = '"+dados.soketatual+"', `statusAtivo` = 'Ativo'  WHERE `usuario`.`token` = '"+dados.tokenGerado+"';"
      console.log(query)
      await connection.awaitQuery(query).then(
        (a)=>{console.log(a)}
      ).catch(
        (e)=>{console.log(e)}
      )
    })

    sock.on("Distancia", async(dados)=>{
      await F.GetDistancia(dados)
    })

    sock.on("disconnect", async () => {
      const sockets = await io.in(sock.id).fetchSockets();
      if (sockets.length === 0) {
        console.log('desconectado '+ sock.id)
        let query = "UPDATE `usuario` SET `soket` = '', `statusAtivo` = 'Inativo'  WHERE `usuario`.`soket` = '"+sock.id+"';"
        await connection.awaitQuery(query).then(
          (a)=>{console.log(a)}
        ).catch(
          (e)=>{console.log(e)}
        )
      }
    });

    sock.on("GetPotoReference", async(dados)=>{
      let foto = await F.PhotoRefence(dados)

    });

    sock.on("RegistrandoEmailUsuario", async(dados)=>{
      console.log(dados, "registrando")
      let query = "INSERT  IGNORE INTO  `usuario` (`id`, `nome`, `email`, `token`, `soket`, `statusAtivo`, `senha`, `dataRegistro`, `fotoPerfil`, `tipoUtilizador`, `VeiculoPlaca`, `VeiculoModelo`, `VeiculoAno`, `VeiculoCor`, `MotoristaHabilitacao`, `MotoristaHabilitacaoValidade`, `DataREgistroComoMotorista`) VALUES (NULL, '', '"+dados.email+"', '"+dados.tokenGerado+"', '"+dados.soketatual+"', '', NULL, CURRENT_TIMESTAMP, '', 'Motorista', NULL, NULL, NULL, NULL, NULL, NULL, NULL);"
      await connection.awaitQuery(query).then(
        (ret)=>{
          io.in(dados.soketatual).emit("RetornoRegistroEmail",ret)
        }
      ).catch(
        (e)=>{console.log(e)}
      )
    })

    sock.on("RegistrarVeiculo", async(dados)=>{
      console.log(dados, "registrando")
      let query = "UPDATE `usuario` SET `VeiculoPlaca` = '"+dados.placa+"', `VeiculoModelo` = '"+dados.modelo+"', `veiculoFabricante` = '"+dados.fabricante+"', `VeiculoAno` = '"+dados.ano+"', `VeiculoCor`= '"+dados.cor+"' , `veiculoFoto` = '"+dados.fotoveiculo+"', `MotoristaHabilitacao` = '"+dados.cnh+"' , `MotoristaHabilitacaoValidade` = '"+dados.validade+"' WHERE `usuario`.`token` = '"+dados.id+"'"
      console.log(query)
      await connection.awaitQuery(query).then(
        (ret)=>{
          console.log('Atualizado')
         // io.in(dados.token).emit("Notificando",ret)
        }
      ).catch(
        (e)=>{console.log(e)}
      )
    })

    sock.on("GetDadosMotorista", async(dados)=>{
      console.log(dados)
      let query = "SELECT *  FROM `usuario` WHERE `email` LIKE '"+dados.email+"' AND `tipoUtilizador` LIKE '"+dados.tipo+"'"
      await connection.awaitQuery(query).then(
        (ret)=>{
          io.in(dados.soket).emit("RetornoDadosUsuarioMotorista",ret)
        }
      ).catch(
        (e)=>{console.log(e)}
      )
    })
    
    //Corridas -------------------------------------
    sock.on("RegistrarCorrida",async (dados)=>{
      console.log('Registrando dados solicitação corrida')
      console.log(dados)
      let query = "INSERT INTO `MotoristaCorridas` (`id`, `MotoristaID`, `PassageiroID`, `dataSolicitacao`, `dataAceitacao`, `origem`,`origemGeolocation`, `destino`,`destinoGeoLocation`, `dataHorapartidaOrigem`, `statusCorrida`, `valorCorrida`) VALUES (NULL, NULL, '"+dados.idpassageiro+"', CURRENT_TIMESTAMP(), NULL, '"+dados.origem+"','"+dados.origemGeoLocation+"', '"+dados.destino+"','"+dados.destinoGeoLocation+"', '"+dados.dataSaida+' '+dados.Horario+"', 'Registrada', '"+dados.valor+"')"
      console.log(query)
       await connection.awaitQuery(query)
       .then( async (a)=>{ io.in(dados.token).emit("CorridaRegistrada"),await F.EmitirndoAlerta()})
       .catch(erro=>(console.log(erro)))
    })

    //Pegando corridas aceitas 

    sock.on("GetCorridasAceitas",async(dados)=>{
      
      await connection.awaitQuery("SELECT id FROM `usuario` WHERE token = '"+dados.token+"'").then(
        async (ret)=>{
          console.log(ret[0].id)
          await connection.awaitQuery("SELECT *, MotoristaCorridas.id as CorridaID FROM `MotoristaCorridas` INNER JOIN usuario WHERE statusCorrida = 'Aceita' and PassageiroID = "+ret[0].id+" AND usuario.id = MotoristaCorridas.MotoristaID;").then(
            (retu)=>{
              console.log(retu)
              io.in(dados.soket).emit("RetornoCorridasAceitas",retu)
            }
          ).catch(
            (e)=>{console.log(e)}
          )

        }
      ).catch(
        (e)=>{console.log(e)}
      )
    })

    sock.on("GetCorridasAceitasMotorista",async(dados)=>{
      
          await connection.awaitQuery("SELECT * FROM `MotoristaCorridas` INNER JOIN usuario WHERE statusCorrida = 'Aceita' and MotoristaID = "+dados.id+" AND usuario.id = MotoristaCorridas.PassageiroID;").then(
            (retu)=>{
              console.log(retu)
              io.in(dados.token).emit("RetornoCorridasAceitas",retu)
            }
          ).catch(
            (e)=>{console.log(e)}
          )

    })

  });
 
const F ={
    async GetDistancia(dados){
      const options = {
        method: 'GET',
        url: 'https://maps.googleapis.com/maps/api/distancematrix/json',
        params: {
          origins: dados.origem,
          destinations: dados.destino,
          mode: 'driving',
          language: 'pt-BR',
          sensor: 'false',
          key: 'AIzaSyBXO36kehkND8-VmFAl1h0nZB-KaPQkGEE'
        }
      };
      
      await  axios.request(options).then(async function (response) {
        console.log(response.data);

        let query = "SELECT * FROM `Configuração`"
        console.log(query)
         await connection.awaitQuery(query)
         .then( async (a)=>{ 

            console.log(a)
            const resp = {
              destination_addresses : response.data.destination_addresses,
              origin_addresses : response.data.origin_addresses,
              rows:[
                {elements :{
                  distance :response.data.rows[0].elements[0].distance,
                  duration: response.data.rows[0].elements[0].duration,
                  Bandeira1 :( response.data.rows[0].elements[0].distance.value /100000) * a[0].Bandeira1 , 
                  Bandeira2 :( response.data.rows[0].elements[0].distance.value /100000) * a[0].Bandeira2,
                  Bandeira3 :( response.data.rows[0].elements[0].distance.value /100000 )* a[0].Bandeira3,
                }
              }
                
              ]
              
            }

            io.in(dados.token).emit("RetornoDistancia",resp)
         })
         .catch(erro=>(console.log(erro)))

      }).catch(function (error) {
        console.error(error);
      });
    },
    async motoristaEncontrado(dados){
        let retor = {
            nomeMotorista:"Alysson",
            corridas :150,
            avaliacao: 4.5
        }
        io.in(dados.token).emit("MotoristaEncontrado",retor ,(ret)=>{
              console.log(ret)
          })
    },
    async GetlocaisProximos(dados){
      const options = {
        method: 'GET',
        url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?photo',
        params: {
          location: dados.Lat+','+dados.Lng,
          radius: '50500',
          type: 'tourist_attraction',
          key: 'AIzaSyBXO36kehkND8-VmFAl1h0nZB-KaPQkGEE'
        },
        headers: {'Access-Control-Allow-Origin': '*'}
      };
      
      return await axios.request(options)
      .then( async  (response) => {
        let resultadosLocaisProximos
        resultadosLocaisProximos = await response.data.results
        return  resultadosLocaisProximos
      }).catch(async (error) => {
        return (error);
      });
    },
    async GetCorridasDisponiveis(){
      let query = "SELECT *, MotoristaCorridas.id as idCorrida , MotoristaCorridas.PassageiroID as idPassageiro FROM `MotoristaCorridas` INNER JOIN usuario WHERE statusCorrida = 'Registrada' and usuario.id = MotoristaCorridas.PassageiroID order by MotoristaCorridas.id DESC  limit 1"
      return await connection.awaitQuery(query)
       .then(ret => { return ret })
       .catch(erro=>(console.log(erro)))
    },
    async GetAllMotoristas(){
      let query = "SELECT * FROM `usuario`  WHERE `usuario`.`tipoUtilizador` = 'Motorista' AND statusAtivo = 'Ativo';"
      return await connection.awaitQuery(query)
       .then(
         (ret)=>{return  ret}
       )
       .catch(erro=>(console.log(erro)))
    },
    async PhotoRefence(dados){
      const options = {
        method: 'GET',
        url: 'https://maps.googleapis.com/maps/api/place/photo',
        params: {
          maxwidth: '200',
          photoreference: dados,
          sensor: 'false',
          key: 'AIzaSyBXO36kehkND8-VmFAl1h0nZB-KaPQkGEE',
          
        }
      };
     return  await  axios.request(options).then( async function (res) {
      console.log("**************")
       console.log(res.request._redirectable._options.href)
       console.log("**************")
           return res.request._redirectable._options.href
      }).catch(function (error) {
        return error
      });
    },
    //Corridas 
    async EmitirndoAlerta(){
      let motoristaAtivos = await F.GetAllMotoristas()
      let corrida_disponivel =  await F.GetCorridasDisponiveis()
      console.log(motoristaAtivos)
      if(motoristaAtivos == undefined){
        console.log('nulo')
        return
      }
      for (let index = 0; index < motoristaAtivos.length; index++) {
        io.in(motoristaAtivos[index].soket).emit("CorridaEncotrada",corrida_disponivel)
         setTimeout(async() => {
            console.log('proximo')
        }, 30000);
      }
    },
    async CorridaCancelada(){ 
      let motoristaAtivos = await F.GetAllMotoristas()
      for (let index = 0; index < motoristaAtivos.length; index++) {
        io.in(motoristaAtivos[index].soket).emit("CorridaCanceladaPeloPassageiro")
         setTimeout(async() => {
            console.log('Corrida Cancelada ')
        }, 30000);
      }
    },
    async RegistrandoMensagemChat(dados){
      let query = "INSERT INTO `Chats` (`idMensagem`, `idRecebedor`, `idEmitente`, `mensagem`, `statusEntrega`, `statusLida`, `dataEnvio`) VALUES (NULL, '"+dados.emitente+"', '"+dados.recebedor+"', '"+dados.mensagem+"', '1', '0', CURRENT_TIMESTAMP);"
      await connection.awaitQuery(query)
      .then( async (a)=>{ console.log(a) })
      .catch(erro=>(console.log(erro)))
    }
}
  
setTimeout(() => {
   F.EmitirndoAlerta()
}, 10000);
