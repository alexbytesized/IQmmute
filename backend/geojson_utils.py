import json
import os

# Global variable to cache the GeoJSON data
GEOJSON_DATA = None

def load_geojson():
    global GEOJSON_DATA
    file_path = os.path.join(os.path.dirname(__file__), "data", "jeepney_route.geojson")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            GEOJSON_DATA = json.load(f)
            print("GeoJSON data loaded successfully.")
    else:
        print("Warning: jeepney_route.geojson not found.")

def find_route_geometry(route_code: str):
    if not GEOJSON_DATA:
        load_geojson()
    
    if not GEOJSON_DATA:
        return None

    # Search for the feature with matching 'ref' (route code)
    # Note: Adjust 'ref' if your route_code matches a different property like 'name'
    for feature in GEOJSON_DATA.get("features", []):
        props = feature.get("properties", {})
        # Check if route_code matches 'ref' or is part of 'name'
        if str(props.get("ref", "")).lower() == route_code.lower():
             return feature.get("geometry")
    return None
