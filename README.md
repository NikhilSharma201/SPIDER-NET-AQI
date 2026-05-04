# 🕸️ SPIDER-NET AQI | Environmental Intelligence Grid

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)

**SPIDER-NET AQI** is a real-time, highly responsive environmental dashboard. It allows users to instantly scan any city globally to retrieve live Air Quality Index (AQI) metrics, temperature, and geographic heatmaps. 

Built for speed and resilience, it utilizes a decoupled architecture where a blazing-fast Python backend proxies live data from external APIs and caches it locally for historical trend analysis.

## ✨ Key Features

* **Real-Time Environmental Scanning:** Fetches live AQI and temperature data using the WAQI API.
* **Interactive Regional Heatmap:** Renders a geographical heatmap of the scanned region using Leaflet.
* **Local Database Timeline:** Tracks and visualizes the last 7 hours of local scans using Recharts.
* **Dynamic Data Backfill Engine:** A custom algorithm that intelligently simulates realistic historical variance for newly searched cities, ensuring the UI timeline never breaks or appears empty on a first-time scan.

---

## 🏗️ System Architecture

Our platform routes user requests through a FastAPI engine, which manages external API calls and local SQLite caching.

```mermaid
graph TD
    classDef frontend fill:#00f0ff,stroke:#333,stroke-width:2px,color:#000;
    classDef backend fill:#ff003c,stroke:#333,stroke-width:2px,color:#fff;
    classDef db fill:#f0b90b,stroke:#333,stroke-width:2px,color:#000;
    classDef external fill:#8a2be2,stroke:#333,stroke-width:2px,color:#fff;

    subgraph Client [Frontend UI]
        A[React Dashboard]:::frontend
        H[Leaflet Heatmap]:::frontend
        I[Recharts Timeline]:::frontend
    end

    subgraph Server [Backend Engine]
        B(FastAPI Application):::backend
    end

    subgraph Storage [Local DB]
        D[(SQLite Database)]:::db
    end

    subgraph Third_Party [External Services]
        C[WAQI Pollution API]:::external
    end

    A -->|1. Searches City| B
    B -->|2. Fetches Live JSON| C
    C -->|3. Returns AQI, Temp, Geo| B
    B -->|4. Saves Current Snapshot| D
    D -->|5. Retrieves Local History| B
    B -->|6. Sends Processed Payload| A
    A -->|7. Renders Gradient Map| H
    A -->|8. Renders Hourly Graph| I
```

## 🌐 The Environmental Grid Concept

SPIDER-NET operates as a pervasive "Environmental Grid." Rather than treating AQI data as isolated data points, the system interlinks geographic nodes, historical variance, and live atmospheric conditions to weave a comprehensive web of environmental intelligence. 

### Core Grid Components

* **Sensory Nodes:** The WAQI endpoints act as the physical sensory nodes of the grid, capturing raw atmospheric variables globally.
* **Processing Matrix:** The FastAPI engine acts as the central processing matrix, filtering, routing, and normalizing the sensory data for consumption.
* **Memory Fabric:** The local SQLite caching mechanism acts as the memory fabric, allowing the grid to remember past states and simulate continuity even when new nodes are integrated.
* **Visual Interface:** The React dashboard provides a human-readable interface to the grid, translating complex data streams into actionable visual insights.

### 🔄 SSE Alert Flow Sequence

Our grid features a real-time event-driven architecture to alert users of critical atmospheric changes as they happen:

```mermaid
sequenceDiagram
    participant User as React Client (Grid Interface)
    participant FastAPI as Backend (Processing Matrix)
    participant WAQI as External APIs (Sensory Nodes)
    participant SSE as Alert Stream (SSE Channel)

    User->>FastAPI: Subscribe to /api/alerts/stream
    FastAPI-->>User: Establish persistent SSE connection (Heartbeat)
    
    loop Every environmental scan
        User->>FastAPI: Query Node (e.g., Delhi)
        FastAPI->>WAQI: Fetch Live Sensory Feed
        WAQI-->>FastAPI: AQI, Temp, Geo Data
        
        alt AQI > 100 (Unhealthy Threshold)
            FastAPI->>SSE: Broadcast Alert Payload
            SSE-->>User: Trigger Grid Notification via Event Stream
        end
        
        FastAPI-->>User: Return Processed Location Data
    end
```
