# 🚛 NEXUS // Autonomous Agentic Supply Chain Command Center

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_Core-FF6F00?style=for-the-badge)](https://langchain-ai.github.io/langgraph/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3.7_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4_Glassmorphism-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![IIT Bhubaneswar](https://img.shields.io/badge/Hosted_at-IIT_Bhubaneswar-E65100?style=for-the-badge)](https://www.iitbbs.ac.in)

> **Autonomous logistics orchestration and disaster rerouting powered by LangGraph, Google Gemini, OpenRouteService, and OpenWeatherMap.**  
> Built for the **AHNDKA Hackathon** at **IIT Bhubaneswar**.

<p align="center">
  <img src="./assets/1.png" alt="NEXUS Command Center - Autonomous Supply Chain Orchestration" width="100%" />
</p>

---

## 🌟 Executive Summary

Global supply chains lose billions of dollars annually due to static routing engines that fail when unpredicted real-world disruptions strike. When a monsoon flash flood drowns an arterial highway or a sudden labor blockade halts transport, legacy ERP systems wait hours for human dispatchers to intervene.

**NEXUS** replaces static dispatching with an **autonomous agentic command center**:
1. **Unstructured Voice & Mobile Crisis Ingestion**: Field drivers speak directly into their mobile phones or browser mic. The raw conversational speech (e.g. *"Yo, I'm stuck near Khandagiri junction on NH-16, massive strike and waterlogging here!"*) is streamed to `/api/report_hazard_voice`. Gemini 3.7 Flash extracts structured entities (`location`, `blockade type`, `severity`) with zero human latency.
2. **LangGraph Strategist Reasoning**: Powered by Google Gemini 3.7 Flash, the agent continuously evaluates live crowdsourced hazard reports, real-time meteorological conditions (OpenWeatherMap), and actual highway topography (OpenRouteService).
3. **Dynamic Closed-Loop Rerouting**: If a primary corridor (such as NH-16) is blocked, the agent autonomously calculates an intermodal bypass corridor (such as the Daya West Canal arterial) directly into the destination.
4. **Automated Stakeholder Dispatch**: The agent autonomously drafts and transmits formal emergency notifications to the warehouse manager and client with verified ETAs, requiring zero manual human overhead.

---

## 🗺️ The Scenario: IIT Bhubaneswar Logistics Corridor

The command center is centered on the industrial freight arteries of **Odisha, India**:
- **Primary Origin**: Bhubaneswar Central Freight Depot (Rasulgarh NH-16 Junction)
- **Primary Destination**: IIT Bhubaneswar Technology & Research Park (Argul Campus, Jatni)
- **Primary Corridor (Route 99)**: The critical **NH-16 national arterial** passing through Vani Vihar, Khandagiri, and Pitapalli.
- **The Disruption**: A severe monsoon storm causing a 4-foot flash flood and a transport strike at the **Khandagiri bottleneck**.
- **The Autonomous Resolution (Route 101 Express)**: The agent calculates a safe green bypass through the **Cuttack-Puri Bypass & Daya West Canal / Sundarpada arterial**, delivering cargo directly to IIT Bhubaneswar's South Gate with only a +7 minute delta.

---

## 🏗️ End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Field ["🌐 Field & Telemetry Layer"]
        Driver["📱 Truck Driver Mobile / Voice Webhook"]
        WeatherAPI["🌦️ OpenWeatherMap API (Live Temp/Rain)"]
        ORS_API["🗺️ OpenRouteService API (400+ GPS Waypoints)"]
    end

    subgraph Backend ["⚡ FastAPI Backend (Port 8010)"]
        Webhook["POST /api/report_hazard"]
        HazardDB[("🧠 In-Memory Hazard Registry")]
        Orchestrator["POST /api/orchestrate"]
        
        subgraph AgenticEngine ["🤖 LangGraph Agentic Brain"]
            StrategistNode["Strategist Node (Gemini 3.7 Flash)"]
            Tools["Tool Executor Node"]
            
            T1["get_crowdsourced_traffic()"]
            T2["get_weather_disruptions()"]
            T3["get_map_routes()"]
            T4["notify_stakeholders()"]
        end
    end

    subgraph Frontend ["🖥️ Command Center UI (Port 5180)"]
        ThreeCanvas["🌌 React Three Fiber 3D Particle Constellation"]
        LeafletMap["🗺️ Dark-Mode Leaflet Map (Live GPS Truck)"]
        TerminalFeed["💻 Agent Activity Terminal & Email Inspector"]
        AudioSFX["🔊 Pitch-Optimized Web Audio API Synthesizer"]
    end

    Driver -->|POST Alert| Webhook
    Webhook --> HazardDB
    HazardDB --> T1
    WeatherAPI --> T2
    ORS_API --> T3
    
    Orchestrator --> StrategistNode
    StrategistNode <--> Tools
    Tools --> T1 & T2 & T3 & T4
    
    T4 -->|Auto-Email| Stakeholders["📧 Warehouse & Client Inboxes"]
    
    Orchestrator -->|Live Telemetry| Frontend
    Frontend --> LeafletMap & TerminalFeed & ThreeCanvas & AudioSFX
```

---

## ✨ Key Features

### 1. Google Maps-Style High-Tech Command Center
- **Dark-Mode Glassmorphism**: Tailored with custom cyber palettes, backdrop blurs, glowing vector borders, and specular light highlights.
- **3D Interactive Particle Constellation**: Built with **React Three Fiber** and Three.js, responding dynamically to normalized mouse coordinates with organic spring physics.
- **3D Parallax Tilt Cards**: Every metric card subtly tilts along the X and Y axes on hover using Framer Motion springs (`useSpring`, `useMotionValue`).

### 2. Live GPS Tracking with Dynamic Vehicle Physics
- Continuous `requestAnimationFrame` loop that calculates the carrier truck's real-time position `[lat, lon]` and spherical bearing angle.
- **Emergency Deceleration**: When Phase 2 triggers, the truck detects the roadblock and **physically stops before the hazard zone** on the map.
- **Autonomous Vector Pivot**: When the agent executes rerouting, the truck marker rotates onto the Daya Canal bypass and drives straight to IIT Bhubaneswar.

### 3. Real Meteorological & Topographic API Integrations
- **OpenWeatherMap API**: Live temperature, humidity, atmospheric pressure, and weather descriptions for Jatani / IIT Bhubaneswar.
- **OpenRouteService API**: Real road directions extracting 400+ turn-by-turn GPS waypoints, actual highway driving distances (33.7 km), and driving durations.

### 4. Pitch-Friendly Synthetic Web Audio SFX
- Built 100% on the browser's native **Web Audio API** (zero external `.mp3` files, zero latency, works completely offline).
- **Dispatch Alert**: Warm, low-pass filtered dual-frequency sine sweep (240Hz &rarr; 175Hz) that commands attention without overpowering the presenter's voice.
- **Mechanical Click & Harmonic Success Chime**: Crisp haptic-style feedback on user interactions and resolution confirmations.
- **Mute / Unmute Toggle**: Quick button in the header bar for full audio control during the presentation.

### 5. Automated Stakeholder Email Dispatcher
- Autonomously drafts and logs urgent dispatch advisories detailing the incident cause, alternative artery, and revised ETA.
- A dedicated **Email Tab** in the Agent Feed allows judges to inspect the outgoing dispatch message in real-time.

---

## 📁 Repository Structure

```text
agentic-supply-chain/
├── .env                                  # API Keys (Gemini, OpenRouteService, OpenWeather)
├── .gitignore                            # Cleaned: ignores venv, node_modules, dist, secrets
├── README.md                             # Comprehensive project documentation
│
├── frontend/                             # Vite + React 18 Application
│   ├── index.html                        # Dark theme entry, Google Fonts, Leaflet CSS
│   ├── package.json                      # React 18, Three.js, R3F, Leaflet, Framer Motion
│   ├── vite.config.js                    # Port 5180 configuration & /api proxy to 8010
│   ├── tailwind.config.js                # Cyber glow animations, dark palettes, scanlines
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx                      # React DOM mount
│       ├── App.jsx                       # Split layout, state orchestration, GPS loop
│       ├── index.css                     # Glassmorphism, cyber glow, Leaflet dark invert filter
│       ├── api/
│       │   └── client.js                 # Axios client with fallback simulation engine
│       ├── utils/
│       │   └── soundEffects.js           # Web Audio API synthesizer (dispatch, click, chime)
│       ├── components/
│       │   ├── Header.jsx                # Telemetry header, live weather badge, audio toggle
│       │   ├── MapView.jsx               # Leaflet map, live GPS truck tracking, A/B pins
│       │   ├── ThreeBackground.jsx       # R3F 3D particle constellation & cyber grid
│       │   ├── AgentFeed.jsx             # Terminal timeline, tool calls, email inspector
│       │   ├── DisruptionBanner.jsx      # Urgent pulsing Framer Motion disruption banner
│       │   ├── ControlPanel.jsx          # Mission controls & mobile driver webhook button
│       │   ├── RouteStatsCard.jsx        # Telemetry metrics, ETA, distance, risk factor
│       │   └── ParallaxCard.jsx          # 3D mouse tilt with specular reflection
│       └── data/
│           └── mockRoutes.js             # Odisha freight presets, NH-16, Daya Canal bypass
│
└── src/                                  # LangGraph & FastAPI Backend
    ├── server.py                         # FastAPI on port 8010 with /api/report_hazard
    ├── nodes.py                          # Strategist Node (Gemini 3.7 Flash)
    ├── tools.py                          # 4 Tools: Maps, Weather, Hazard DB, Email
    ├── state.py                          # SupplyChainState TypedDict schema
    └── main.py                           # Standalone CLI entrypoint
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & **npm**

### 1. Clone & Configure `.env`
```bash
git clone https://github.com/Arkz-Deepak/agentic-supply-chain.git
cd agentic-supply-chain
```

Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_google_gemini_api_key
MAP_API_KEY=your_openrouteservice_api_key
WEATHER_API_KEY=your_openweathermap_api_key
```
*(The system also supports `OPENROUTE_API_KEY` and `OPENWEATHER_API_KEY` as aliases).*

---

### 2. Launch the FastAPI Backend (Port 8010)

```powershell
# In root directory:
.\venv\Scripts\python.exe -m uvicorn server:app --app-dir src --host 0.0.0.0 --port 8010 --reload
```
*Backend runs at: **http://localhost:8010***  
*Interactive Swagger API documentation: **http://localhost:8010/docs***

---

### 3. Launch the Vite Frontend (Port 5180)

```powershell
# In frontend directory:
cd frontend
npm install
npm run dev
```
*Command Center runs at: **http://localhost:5180***

> **Note**: Dedicated ports (`8010` and `5180`) ensure complete isolation from other local projects on ports `8000` or `5173`.

---

## 📡 API Reference

### 1. `POST /api/report_hazard`
Webhook for field drivers or IoT systems to report a crisis via text.
```bash
curl -X POST http://localhost:8010/api/report_hazard \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Khandagiri Junction NH-16",
    "description": "Transport union strike & 4ft monsoon waterlogging."
  }'
```

### 2. `POST /api/report_hazard_voice` (Natural Language Speech-to-NLP)
Webhook that accepts raw conversational voice transcripts and extracts structured data with Gemini 3.7 Flash:
```bash
curl -X POST http://localhost:8010/api/report_hazard_voice \
  -H "Content-Type: application/json" \
  -d '{
    "raw_transcript": "Yo, I am from this area near Khandagiri on NH-16 and there is a huge problem right here with a transport union strike and 4ft waterlogging, road is totally blocked!"
  }'
```
**Response (Gemini Entity Extraction):**
```json
{
  "status": "success",
  "parsed": {
    "location": "Khandagiri, NH-16",
    "description": "Transport union strike and 4ft waterlogging causing complete road blockage",
    "severity": "CRITICAL"
  },
  "active_reports": [
    "Khandagiri, NH-16: Transport union strike and 4ft waterlogging causing complete road blockage"
  ]
}
```

### 3. `GET /api/weather`
Fetches real-time weather from OpenWeatherMap for any coordinate (defaults to IIT Bhubaneswar).
```bash
curl http://localhost:8010/api/weather?lat=20.1484&lon=85.6711
```

### 3. `POST /api/routes/directions`
Fetches real highway driving geometry from OpenRouteService.
```bash
curl -X POST http://localhost:8010/api/routes/directions \
  -H "Content-Type: application/json" \
  -d '{
    "start": [20.3010, 85.8640],
    "dest": [20.1484, 85.6711]
  }'
```

### 4. `POST /api/orchestrate`
Executes the LangGraph multi-tool workflow with Google Gemini 3.7 Flash.

---

## 🎯 Hackathon Presentation Pitch Script

| Stage | Action on Screen | Audio / Visual Result | What to Say to the Judges |
| :--- | :--- | :--- | :--- |
| **1. Intro** | Open `http://localhost:5180` | Dark glassmorphism dashboard loads. 3D particle constellation rotates with cursor. Map focuses on IIT Bhubaneswar. Header displays live weather (`27.1°C • Broken Clouds`). | *"Welcome to NEXUS, an autonomous agentic logistics core developed for the AHNDKA Hackathon at IIT Bhubaneswar."* |
| **2. Phase 1** | Click **"Phase 1: Calculate Route"** | Mechanical click sounds. OpenRouteService computes 408 real highway coordinates. Carrier TRK-8821 begins driving along NH-16. | *"In Phase 1, our system operates like Google Maps, establishing the optimal commercial freight arterial from Bhubaneswar Central Depot to IIT Bhubaneswar Campus."* |
| **3. Phase 2** | Click **"Phase 2: Driver Reports Strike"** (or fire `POST /api/report_hazard` from phone) | Dispatch alert tone sounds. Red pulsing hazard bloom appears at Khandagiri. **The truck physically brakes and halts on the road.** | *"A real-world crisis occurs: A driver reports an emergency strike and flash flood at Khandagiri. Notice the carrier halts in real time—our agent is actively monitoring the fleet."* |
| **4. Agent Action** | Click **"AUTONOMOUS AGENT REROUTE & EMAIL STAKEHOLDERS"** | Terminal stream logs Gemini evaluating crowdsourced reports, calling OpenRouteService, and invoking `notify_stakeholders`. | *"Instead of stalling for hours, our LangGraph agent autonomously evaluates the driver report, computes the Daya West Canal bypass, and drafts stakeholder emails."* |
| **5. Resolution** | Automatic transition | Harmonic chime plays. Emerald bypass corridor illuminates. **The truck marker turns onto the green bypass and accelerates into IIT Bhubaneswar.** | *"The delivery is saved with only a 7-minute delta. Click the Email tab to see the formal dispatch notice already delivered to the warehouse manager. Zero human latency."* |

---

## 🛡️ License

This project is open-source under the **MIT License**. Built with pride for the **AHNDKA Hackathon** at **IIT Bhubaneswar**.
