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
    content TEXT,
    username TEXT
)
    `)

    io.on('connection', async (socket) => {
        console.log('a user has connected')
    
        socket.on('disconnect', () => console.log("a user has disconnected"))
    
        // Variable para seguir el estado de los mensajes cargados
        let loadedMessages = []; // Esta lista llevará el control de los mensajes que ya se han cargado
        let allMessagesLoaded = false; // Para saber si ya se cargaron todos los mensajes
    
        // Empezamos a emitir mensajes cuando el cliente se conecta
        socket.on('load more messages', async () => {
    // Salir si ya cargamos todos los mensajes
    if (allMessagesLoaded) return;

    const lastLoadedMessageId = loadedMessages.length > 0 ? loadedMessages[0].id : 0;

    try {
        const messagesToLoad = await db.execute({
            sql: 'SELECT id, content, username FROM messages WHERE id < ? ORDER BY id DESC LIMIT 50',
            args: [lastLoadedMessageId]
        });

        if(allMessagesLoaded == false){
            // Agrega los mensajes cargados al inicio de la lista
            messagesToLoad.rows.forEach(message => {
                socket.emit('chat old messages', message.content, message.id.toString(), message.username);
            });

            // Verificar uno por uno de los mensajes que se están por mostrar si alguno es el id 0
            messagesToLoad.rows.forEach(item => {
                if(item["id"] == 1){
                    allMessagesLoaded = true
                    socket.emit('no more messages');
                    return;
                }
            })
        }
        // Actualiza la lista de mensajes cargados
        loadedMessages = [...messagesToLoad.rows, ...loadedMessages];

    } catch (error) {
        console.error('Error al cargar más mensajes:', error);
    }
});

    
        // Cargar solo los mensajes más recientes al conectarse
        const loadRecentMessages = async (limit = 50) => {
            try {
                const results = await db.execute({
                    sql: 'SELECT id, content, username FROM messages ORDER BY id DESC LIMIT ?',
                    args: [limit]
                });
    
                // Enviar los mensajes en orden inverso para que aparezcan correctamente en el frontend
                const orderedMessages = results.rows.reverse();
                orderedMessages.forEach(row => {
                    socket.emit('chat message', row.content, row.id, row.username);
                });
    
                // Marcar como cargados estos mensajes (del 31 al 81)
                loadedMessages = results.rows;
            } catch (err) {
                console.error(err);
            }
        };
    
        // Cargar mensajes recientes al conectar el usuario
        await loadRecentMessages();
        
        socket.on('chat message', async (msg) => {
            const username = socket.handshake.auth.username ?? 'anonymous';
            try {
                const result = await db.execute({
                    sql: `INSERT INTO messages (content, username) VALUES (:msg, :username)`,
                    args: { msg, username }
                });
        
                console.log("Mensaje guardado y enviado:", msg, result.lastInsertRowid, username);  // Verifica si esto se está ejecutando
        
                // Emitir el evento de nuevo mensaje al cliente
                io.emit('chat message', msg, result.lastInsertRowid.toString(), username);
            } catch (e) {
                console.error(e);
            }
        });
    
        // Ruta para cargar más mensajes antiguos al solicitarlo desde el cliente
        socket.on('load older messages', async (lastLoadedId) => {
            try {
                const results = await db.execute({
                    sql: 'SELECT id, content, username FROM messages WHERE id < ? ORDER BY id DESC LIMIT 20',
                    args: [lastLoadedId]
                });
    
                const olderMessages = results.rows.reverse();
                olderMessages.forEach(row => {
                    socket.emit('chat message', row.content, row.id, row.username);
                });
            } catch (err) {
                console.error(err);
            }
        });
    });
    

app.use(logger('dev'))

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/index.html')
})

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})