import express from "express";
import compression from "compression";
import cors from 'cors';
import SSE from "express-sse";
import { getRecentlyViolatingDrones, recentViolations } from "./getViolatingDrones.js";
import path from "path"
import { fileURLToPath } from "url";

const app = express()
app.use(compression()) // Compression middleware is required for express-sse to work
app.use(cors())

const PORT = process.env.PORT || 8080
const sse = new SSE()

// Workaround to make __dirname work when using modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '/../birdnest-frontend/build')))

// Clients will send a request to this route to set up listening to server side events
app.get('/stream', (req, res) => {
    sse.init(req, res) // Start sending events to this client
    sse.send(recentViolations) // Send currently stored violations to the client that just joined
});

// Anything that doesn't match the above, send back index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/../birdnest-frontend/build/index.html'))
})

app.listen(PORT, () => {
  console.log(`Birdnest app listening on port ${PORT}`)
})

/*  Store previously sent violations. New violations are compared to these to
    determine whether we need to send any data to the clients. Stored as a
    JSON string because it allows us to make a deep equality check by simply
    comparing the strings. */
let previousSentViolations = ""

const reportDrones = async () => {
    const violationsToSend = await getRecentlyViolatingDrones()
    /*  Compare violations that we want to send to those previously sent.
        If they are equal, there is no need to send anything to the clients.
        This reduces the amount of requests. */
    const jsonStringViolations = JSON.stringify(violationsToSend)
    if (jsonStringViolations !== previousSentViolations) {
        sse.send(violationsToSend) // Send the violations array to all clients
    }
    previousSentViolations = jsonStringViolations
}

setInterval(reportDrones, 2000)
