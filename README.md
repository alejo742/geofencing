# Evergreen Geofencing Tool

A comprehensive web application for defining geofence boundaries and managing location-based triggers for Dartmouth campus structures. This tool allows users to create accurate geofences by combining map-drawn boundaries with real-world GPS walking points, and then configure automated triggers for entry/exit events.

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/alejo742/geofencing.git
cd geofencing

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the application.

### Browser Compatibility

For best results, use this tool on a mobile device with GPS capabilities. The app works in most modern browsers, but we recommend:
- Chrome/Safari on iOS
- Chrome on Android

## Application Overview

The Evergreen Geofencing Tool consists of two main sections:

1. **Geofencing** - Define and refine structure boundaries
2. **Triggers** - Configure location-based notifications and flows

Use the navigation bar to switch between these sections.

## Part 1: Creating Geofences

### 1. Creating a New Structure

1. Click the "New Structure" button in the sidebar
2. Enter the name of the building or area (e.g., "Baker Library")
3. Enter a unique code/identifier (e.g., "BAKER")
4. Select the structure type (academic, residential, dining, etc.)
5. Optionally select a parent structure to create a hierarchy
6. Click "Create" to start defining the structure

### 2. Managing Structure Hierarchy

The app supports parent-child relationships between structures:

#### Creating Hierarchical Structures
- When creating a new structure, you can select an existing structure as its parent
- This creates a hierarchy (e.g., "Baker Library" → "Reading Room" → "Study Carrel 1")
- Useful for complex buildings with multiple zones or nested areas

#### Using the Hierarchy Manager
- Click the "Hierarchy" button in the header to open the hierarchy manager
- View the complete structure tree with indentation showing relationships
- Edit parent-child relationships by selecting a structure and choosing a new parent
- The system prevents circular dependencies (a structure cannot be its own ancestor)

### 3. Drawing Boundaries

The app allows you to define boundaries in two ways simultaneously:

#### Map Drawing (Manual)
- Click directly on the map to place points
- Points will connect automatically to form a polygon
- Drag any point to reposition it
- Click a point to select/delete it

#### GPS Walking (Physical)
- Walk to a corner or boundary point of the building
- Enable "GPS Mode" using the toggle
- Click "Add Walk Point" to drop a point at your current location
- Repeat for each corner of the building
- The app shows your current GPS accuracy

### 4. Adjusting the Trigger Band

Once you have both map-drawn and GPS-walked points:

1. A "trigger band" is automatically generated between the two boundaries
2. Use the thickness slider to adjust how wide this band should be
3. The trigger band represents the area where location-based events will fire

## Part 2: Managing Triggers

### Accessing Triggers Management

Click "Triggers" in the navigation bar to access the triggers management system.

### 1. Creating a New Trigger

1. Click "Create Trigger" on the triggers page
2. **Select a Structure**: Search and select the campus structure for your trigger
3. **Choose Trigger Type**:
   - **On Enter**: Fires when user enters the structure boundary
   - **On Exit**: Fires when user leaves the structure boundary
4. **Configure Notification**:
   - **Title**: Main notification text (3-50 characters)
   - **Body**: Additional notification details (3-100 characters)
5. **Set Flow ID**: Dialogflow CX flow identifier that will be triggered
6. Click "Create Trigger" to save

### 2. Trigger Validation and Rules

- **Duplicate Prevention**: Each structure can have only one "enter" trigger and one "exit" trigger
- **Real-time Validation**: The form prevents creating duplicate triggers and shows which trigger types already exist
- **Character Limits**: Enforced to ensure notifications display properly on mobile devices
- **Flow ID Format**: Must be alphanumeric with underscores and hyphens only

### 3. Managing Existing Triggers

#### Trigger List Features
- **Search**: Filter triggers by title, structure name, or flow ID
- **Statistics**: View quick stats including total triggers, active triggers, and structures with triggers
- **Status Toggle**: Activate/deactivate triggers without deleting them
- **Bulk Actions**: Export/import trigger configurations

#### Editing Triggers
- Click "Edit" on any trigger to modify its configuration
- All validation rules apply to edits
- Changes are saved immediately

#### Deleting Triggers
- Click "Delete" to remove a trigger permanently
- Confirmation is required before deletion

### 4. Export and Import

#### Exporting Triggers
- Click "Export Triggers" to download a JSON file containing all trigger configurations
- Export includes metadata like creation dates and statistics
- Use for backup, sharing with team members, or deploying to production

#### Importing Triggers
- Click "Import Triggers" and select a previously exported JSON file
- Existing triggers with matching IDs will be updated
- New triggers will be created
- Import validation ensures data integrity

## Understanding the Exported Data

### Geofence Data Structure

The exported geofence data contains structure definitions with:

```json
{
  "version": "2.0",
  "structures": [
    {
      "code": "BAKER",
      "name": "Baker Library",
      "description": "Main campus library with study spaces",
      "type": "academic",
      "parentId": null,
      "mapPoints": [{"lat": 43.7056, "lng": -72.2943}, ...],
      "walkPoints": [{"lat": 43.7055, "lng": -72.2944}, ...],
      "triggerBand": {
        "points": [...],
        "thickness": 5
      },
      "lastModified": "2025-08-23T16:30:22Z"
    }
  ]
}
```

### Triggers Data Structure

The exported triggers data contains trigger configurations:

```json
{
  "version": "1.0",
  "triggers": [
    {
      "id": "trigger-123",
      "structureCode": "BAKER",
      "triggerType": "enter",
      "notificationConfig": {
        "title": "Welcome to Baker Library!",
        "body": "Tap to see study spaces and current hours"
      },
      "flowId": "library_main_flow",
      "isActive": true,
      "createdAt": "2025-08-23T15:30:00Z",
      "updatedAt": "2025-08-23T15:30:00Z"
    }
  ],
  "metadata": {
    "exportedAt": "2025-08-23T16:45:00Z",
    "totalTriggers": 1
  }
}
```

## Using the Data in Your Applications

### For Flutter/Dart Integration

The exported trigger data is designed to work seamlessly with the Flutter geofencing implementation. You just have to parse the JSON and create triggers using the provided structure codes.

```dart
// Import trigger configuration
final Map<String, List<GeofencingTrigger>> structureTriggers = {};

// Group triggers by structure code
for (final trigger in triggerData.triggers) {
  if (!structureTriggers.containsKey(trigger.structureCode)) {
    structureTriggers[trigger.structureCode] = [];
  }
  structureTriggers[trigger.structureCode]!.add(trigger);
}

// Set up geofencing triggers for each structure
for (final entry in structureTriggers.entries) {
  final structureCode = entry.key;
  final triggers = entry.value;
  
  // Find enter and exit triggers
  final enterTrigger = triggers.firstWhere(
    (t) => t.triggerType == 'enter',
    orElse: () => null,
  );
  final exitTrigger = triggers.firstWhere(
    (t) => t.triggerType == 'exit',
    orElse: () => null,
  );
  
  EvergreenGeofencing.setStructureTriggers(
    structureCode,
    onEnterTrigger: enterTrigger != null ? GeofencingTrigger(
      callback: (code, name, location) async {
        // Show notification if configured
        if (enterTrigger.isActive) {
          await NotificationService.show(
            title: enterTrigger.notificationConfig.title,
            body: enterTrigger.notificationConfig.body,
          );
          
          // Trigger Dialogflow
          await Dialogflow.triggerFlow(enterTrigger.flowId);
        }
      },
      notificationConfig: NotificationConfig(
        title: enterTrigger.notificationConfig.title,
        body: enterTrigger.notificationConfig.body,
      ),
    ) : null,
    onExitTrigger: exitTrigger != null ? GeofencingTrigger(
      callback: (code, name, location) async {
        // Show notification if configured
        if (exitTrigger.isActive) {
          await NotificationService.show(
            title: exitTrigger.notificationConfig.title,
            body: exitTrigger.notificationConfig.body,
          );
          
          // Trigger Dialogflow
          await Dialogflow.triggerFlow(exitTrigger.flowId);
        }
      },
      notificationConfig: NotificationConfig(
        title: exitTrigger.notificationConfig.title,
        body: exitTrigger.notificationConfig.body,
      ),
    ) : null,
  );
}
```

### Alternative Approach: Individual Trigger Setup

If you prefer to handle each trigger individually:

```dart
// Assuming we're already looping through the correct triggers
for (final trigger in triggers) {
  if (!trigger.isActive) continue; // Skip inactive triggers
  
  final geofencingTrigger = GeofencingTrigger(
    callback: (code, name, location) async {
      // Show notification and trigger flow
      await NotificationService.show(
        title: trigger.notificationConfig.title,
        body: trigger.notificationConfig.body,
      );
      await Dialogflow.triggerFlow(trigger.flowId); // assuming there's a Dialogflow service
    },
    notificationConfig: NotificationConfig(
      title: trigger.notificationConfig.title,
      body: trigger.notificationConfig.body,
    ),
  );
  
  // Use ternary operator to determine trigger type
  trigger.triggerType == 'enter' 
    ? EvergreenGeofencing.setStructureTriggers(
        trigger.structureCode,
        onEnterTrigger: geofencingTrigger,
      )
    : EvergreenGeofencing.setStructureTriggers(
        trigger.structureCode,
        onExitTrigger: geofencingTrigger,
      );
}
```

## Navigation

- **Geofencing Tab**: Create and manage structure boundaries
- **Triggers Tab**: Configure location-based notifications and flows
- **Back Button**: Navigate back to previous screens when creating/editing
- **Hierarchy Manager**: Access advanced structure relationship management

## About Next.js

This project uses [Next.js](https://nextjs.org) with the App Router and TypeScript. For more information about Next.js, check out:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)