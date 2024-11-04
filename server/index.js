import express from "express";

const port = process.env.port ?? 3000 

const app = express()

app.get('/', (req, res) => {
    res.send('Hola Chat!')
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})