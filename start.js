
import {httpServer, app } from './Soket.js'
import {connection} from './mysqlConexao.js'

let port = 5002
let host = '192.168.2.128'

app.get('/', (req, res) => {
  res.send('Soket tuor drive rodando')
})
httpServer.listen(port, host, () => {
  console.log(`Server is listening on http://${host}:${port}`)
});


