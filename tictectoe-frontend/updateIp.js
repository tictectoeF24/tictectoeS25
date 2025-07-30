const fs = require("fs");
const { networkInterfaces } = require("os");

function getLocalIP() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }
    return null;
}

const localIP = getLocalIP();

if (!localIP) {
    console.error("Could not determine local IP address.");
    process.exit(1);
}

const filePath = "./config.js";
const fileContent = `export const BASE_URL_IN_CONFIG = "http://${localIP}:3001";\n`;

fs.writeFileSync(filePath, fileContent);
console.log(`Updated BASE_URL to: ${fileContent}`);
