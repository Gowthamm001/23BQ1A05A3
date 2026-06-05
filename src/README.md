# Vehicle Maintenance Scheduler & Notification Pipeline

A complete, production-ready backend microservice built using Node.js, Express, and TypeScript for the Affordmed Campus Drive assessment track.

## Core Implementations
* **Stage 1 (Logging Middleware & System Design):** Implemented globally bound request-lifecycle tracers via Winston JSON stream logs. Added comprehensive notification system architecture specifications in `notification system design.md`.
* **Stage 2 (State Engine & CRUD):** Data models, data ingestion controllers, and configuration files tracking mutable components in memory.
* **Stage 3 (Automation Engine & Hooks):** Automated background worker loop evaluating threshold criteria ($Current \ge Limit$) and dispatching async payloads to the downstream consumer bridge.

## How To Run Locally
1. Install Dependencies: `npm install`
2. Spin up the App: `npm run dev`
3. Execute Test Pipeline Simulation: `node simulate_pipeline.js`