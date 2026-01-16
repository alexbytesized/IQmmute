import * as turf from "@turf/turf";

export function findRoutesNearDestination(geojson, destLat, destLng, thresholdM = 500) {
  const destPoint = turf.point([destLng, destLat]);
  const bestByRef = new Map(); // ref -> best match object (closest)

  for (const feature of geojson.features ?? []) {
    const geom = feature?.geometry;
    const t = geom?.type;

    if (t !== "LineString" && t !== "MultiLineString") continue;

    let bestDistM = Infinity;

    if (t === "LineString") {
      const distKm = turf.pointToLineDistance(destPoint, feature, { units: "kilometers" });
      bestDistM = distKm * 1000;
    } else {
      // MultiLineString: compute distance to each LineString part, take the minimum
      for (const coords of geom.coordinates) {
        const line = turf.lineString(coords);
        const distKm = turf.pointToLineDistance(destPoint, line, { units: "kilometers" });
        const distM = distKm * 1000;
        if (distM < bestDistM) bestDistM = distM;
      }
    }

    if (bestDistM > thresholdM) continue;

    const props = feature.properties ?? {};
    const ref = props.ref ?? null;
    if (!ref) continue;

    const candidate = {
      ref,
      name: props.name,
      distance_m: Math.round(bestDistM),
      // Keep one representative ID (optional)
      osm_id: props["@id"] ?? feature.id,
      // Optional: keep one geometry (the closest one)
      geometry: geom,
    };

    const existing = bestByRef.get(ref);
    if (!existing || candidate.distance_m < existing.distance_m) {
      bestByRef.set(ref, candidate);
    }
  }

  // Return unique refs sorted by closest
  return Array.from(bestByRef.values()).sort((a, b) => a.distance_m - b.distance_m);
}
