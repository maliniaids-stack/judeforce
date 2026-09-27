# 🎥 Prism AI Demo Videos

This directory contains the links and information for the video demonstrations of Prism AI evaluating our core capabilities.

### 🔗 [View All Demo Videos on Google Drive](https://drive.google.com/drive/folders/1kVAlRx1roWhoYzQcKOEtgam5LHUy_XVs?usp=sharing)

---

## 📹 Video Breakdown

### 1. Offline Working Proof
**Objective:** Prove that the platform runs 100% locally without any internet connection.
- Demonstrates the network adapter being disabled (Wi-Fi/Ethernet off).
- Shows the user uploading a document, selecting parameters, and generating an output format.
- Proves that the LLM inference, embedding generation, and guardrails function entirely on the host hardware.

### 2. Online Working (Live Demonstration)
**Objective:** Showcase the full workflow in a standard environment.
- Demonstrates the speed and fluidity of the React/Vite UI.
- Shows multiple formats being generated from a single prompt (e.g., PDF to Twitter Thread & Video Script).
- Highlights the instant preview functionality and the formatted export capabilities.

### 3. Database and Backend Working
**Objective:** Provide a technical deep-dive into the 3-Database Architecture and pipeline flow.
- Demonstrates the Docker containers running (PostgreSQL, Qdrant, MinIO, Redis).
- Shows the FastAPI logs processing the Celery background tasks in real-time.
- Highlights the vector embeddings being stored in Qdrant and files uploading to MinIO.
- Proves the execution of Input and Output Guardrails (PII redaction, hallucination checks) via backend logs.
