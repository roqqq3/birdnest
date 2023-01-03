import express from "express";
import compression from "compression";
import cors from 'cors';
import SSE from "express-sse";
import getViolatingDrones from "./getViolatingDrones.js";
import path from "path"
import { fileURLToPath } from "url";

const app = express()
app.use(compression()) // Compression middleware is required for express-sse to work
app.use(cors())

const PORT = 8080
const sse = new SSE()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../birdnest-frontend/build')))

// Clients will send a request to this route to set up listening to server side events
app.get('/stream', sse.init);

// Anything that doesn't match the above, send back index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '../birdnest-frontend/build/index.html'))
})

app.listen(PORT, () => {
  console.log(`Birdnest app listening on port ${PORT}`)
})

/*  Object that drone violations are stored in. Format of the object
    is [serialNumber] --> Array[Drone]. This format was chosen because we want
    to show the closest violation for each drone in the last 10 minutes. */
let recentViolations = {}
/*  Store previously sent violations. New violations are compared to these to
    determine whether we need to send any data to the clients. Stored as a
    JSON string because it allows us to make a deep equality check by simply
    comparing the strings. */
let previousSentViolations = ""

const reportDrones = async () => {
    const nowViolatingDrones = await getViolatingDrones()
    nowViolatingDrones.forEach(drone => {
        if (recentViolations[drone.serialNumber]) {
            recentViolations[drone.serialNumber].push(drone)
        } else {
            recentViolations[drone.serialNumber] = [drone]
        }
    })
    // Timestamp 10 minutes ago
    const removeTimestamp = new Date(Date.now() - 10 * 60 * 1000)
    // Remove violations older than 10 minutes from each drone.
    Object.keys(recentViolations).forEach(droneSerial => {
        const oldRemoved = recentViolations[droneSerial].filter(drone => new Date(drone.timestamp) > removeTimestamp)
        if (oldRemoved.length === 0) {
            // If there are no recent violations for this drone anymore, remove the serial key.
            delete recentViolations[droneSerial]
        } else {
            recentViolations[droneSerial] = oldRemoved
        }
    })
    // For each drone, return the closest violation.
    const violationsToSend = Object.values(recentViolations).map(droneList =>
        droneList.reduce((closest, curr) =>
            !closest || curr.distToNest < closest.distToNest
                ? curr
                : closest
        , null)
    )
    /*  Compare violations that we want to send to those previously sent.
        If they are equal, there is no need to send anything to the clients. */
    const jsonStringViolations = JSON.stringify(violationsToSend)
    if (jsonStringViolations !== previousSentViolations) {
        sse.send(violationsToSend)
    }
    previousSentViolations = jsonStringViolations
}

setInterval(reportDrones, 2000)
