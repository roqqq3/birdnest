import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false })

const getDroneDistToNest = (drone) => {
    const nestX = 250000
    const nestY = 250000 // X and Y are separated for clarification purposes
    console.log(Math.hypot(drone.positionX - nestX, drone.positionY - nestY))
    return Math.hypot(drone.positionX - nestX, drone.positionY - nestY)
}

const getDronePilot = async (serial) => {
    const response = await fetch(`http://assignments.reaktor.com/birdnest/pilots/${serial}`)
    if (!response.ok) { // Returned something other than 200, e.g. 404
        console.error(`Error in fetching pilot details for drone with serial number ${serial}. Statuscode ${response.status}`)
        return null
    }
    return await response.json()
}

const distanceToMeters = (dist) => {
    /*  Convert millimeters to meters and round to 2 decimal places.
        Epsilon is used to ensure that numbers such as 1.005 are rounded correctly. */
    return Math.round((dist / 1000 + Number.EPSILON) * 100) / 100
}

const getViolatingDrones = async () => {
    try {
        const response = await fetch("http://assignments.reaktor.com/birdnest/drones")
        if (!response.ok) { // Returned something other than 200, e.g. 404
            throw Error(`Error in fetching drones: ${response.status}`)
        }
        const xml = await response.text()
        const jsObject = parser.parse(xml)
        const timestamp = jsObject.report.capture["@_snapshotTimestamp"]
        const allDrones = jsObject.report.capture.drone
        const allDronesWithDist = allDrones.map(drone => ({...drone, distToNest: getDroneDistToNest(drone) }))
        const violatingDrones = allDronesWithDist.filter(drone => drone.distToNest < 100000)
        /*  Fetch pilots for all violating drones. This is done separately
            because it allows the promises to run parallel instead of awaiting each
            promise inside the map function below. */
        const pilots = await Promise.all(violatingDrones.map(drone => getDronePilot(drone.serialNumber)))
        return violatingDrones.map((drone, idx) => ({ // Only send necessary data to make requests lighter
            serialNumber: drone.serialNumber, // Used as unique ID in React frontend
            timestamp: timestamp,
            distToNest: distanceToMeters(drone.distToNest),
            pilot: pilots[idx]
        }))
    } catch(error) {
        console.error("Error in fetching drones or parsing drone XML data", error)
        return []
    }
}

export default getViolatingDrones