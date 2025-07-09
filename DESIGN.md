# Evergreen Geofencing Helper App – Simple Overview

## What is This?

This is a simple web app for the Evergreen team to quickly create and adjust geofence boundaries for Dartmouth campus locations. It helps us make sure our app knows where buildings and places are, using both map clicks and real-world walking. 

**It should be pretty simple to get done, probably 3-4 days to have it deployed and we can get someone started to grab data.**

---

## How Does It Work? (Step-by-Step)

1. **Add a Structure**
   - Start a new Structure and name it (like “Baker Library”) to start working on.

2. **Mark Boundaries on the Map**
   - Click on the map to roughly outline the building or area.
   - This is fast, but might not be 100% accurate in practice (when people actually walk there).

3. **Mark Boundaries in Real Life**
   - Walk to each corner or important spot of the building.
   - Use your phone to “drop a point” at each spot (the app grabs your GPS location).
   - This gives us real-world data, even if the GPS is a little off.

4. **Polish the Data**
   - The app shows both the map points and the real-world points.
   - You can adjust points if needed.
   - You can also set how “thick” the trigger area is (the space between the map and walked lines), making it tighter or looser.

5. **Export the Data**
   - When you’re happy, export all geofences as a single JSON file.
   - This file includes all buildings/areas you’ve mapped. Multiple members can export multiple JSON files and we can then merge them together to have a big data map of Dartmouth! Or one person can be in charge of the whole mapping thing and therefore produce only one, whole JSON.

---

## Tools We Use

- **Leaflet or Mapbox** for the map and drawing.
- **Browser Geolocation API** for real-world points.
- **turf.js** for handling the math and adjusting boundaries.
- **GeoJSON/JSON** format for easy sharing and use in our main app.

---

## Summary

This tool lets us:
- Add and adjust campus locations by clicking and walking.
- See and fix any errors before exporting.
- Keep all our location data in one easy-to-use file.
