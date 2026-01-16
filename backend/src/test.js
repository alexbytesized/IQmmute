import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { findRoutesNearDestination } from "./find_valid_routes.js";

// Resolve this file's directory (so paths work no matter where you run node from)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up from /src to /backend, then into /data
const geojsonPath = path.join(__dirname, "..", "data", "jeepney_route.geojson");

// Load GeoJSON
const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf8"));

// Example destination (lat, lng)
const destLat = 14.5640135;
const destLng = 120.9864363;

// Find routes within 500 meters
const nearRoutes = findRoutesNearDestination(geojson, destLat, destLng, 500);

console.log("Nearby route refs:", nearRoutes.map((r) => r.ref));
//console.log("Detailed:", JSON.stringify(nearRoutes, null, 2));