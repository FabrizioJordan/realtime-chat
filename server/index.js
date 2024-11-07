import express from "express";
import logger from "morgan"
import dotenv from "dotenv"
import { createClient } from "@libsql/client";

import { Server } from "socket.io";
import { createServer } from "node:http"

dotenv.config()

const port = process.env.port ?? 3000 

const app = express() // creando app con express

// agregando folder public para cargar archivos estáticos
app.use(express.static('public'))

const server = createServer(app) // creando server http

const io = new Server(server, {
    connectionStateRecovery: {
    }
})

const db = createClient({
    url: "libsql://exact-monstress-fabriziojordan.turso.io",
    authToken: process.env.DB_TOKEN
})

await db.execute(`
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT
)
    `)

io.on('connection', (socket) => {
    console.log('a user has connected')

    socket.on('disconnect', () => console.log("an user has disconnected"))

    socket.on('chat message', (msg) => {
        
        io.emit('chat message', msg)
    })
})

app.use(logger('dev'))

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/index.html')
})

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})