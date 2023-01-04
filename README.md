# birdnest
My solution for Reaktor 2023 summer coding challenge "Birdnest".

Available in: https://birdnest-app.herokuapp.com/

Uses [server side events (SSE)-API](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) instead of polling from the frontend.
Events are only sent when necessary, which reduces the amount of requests.
