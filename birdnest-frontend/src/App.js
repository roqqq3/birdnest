import "./style.css"
import { useEffect, useState } from "react"

const App = () => {
    const [drones, setDrones] = useState([])

    useEffect(() => {
        // Start listening to server side events
        var es = new EventSource("/stream");
        es.onmessage = (event) => {
            const newDrones = JSON.parse(event.data)
            setDrones(newDrones)
        };
    }, [])

    const renderListItem = (drone) => {
        if (!drone.pilot) {
            return "Unknown pilot"
        }
        return (
            <div key={drone.serialNumber} className="list-item">
                <p>{drone.pilot.firstName} {drone.pilot.lastName}</p>
                <p>{drone.pilot.email}</p>
                <p>{drone.pilot.phoneNumber}</p>
                <p>Closest distance to nest: {drone.distToNest}m</p>
            </div>
        )
    }

    return (
        <div id="list">
            {drones.map(renderListItem)}
        </div>
    )
}

export default App;
