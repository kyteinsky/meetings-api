"use strict";

const http = require("http");
const { routeEndpoints } = require("./routes");

const PORT = 3000;

const server = http.createServer(routeEndpoints);

server.listen(PORT, () => console.log("Server listening on port:", PORT));
