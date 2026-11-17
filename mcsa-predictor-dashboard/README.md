# AI-Powered Maintenance Predictor | MCSA & Multimodal Fault Detection

HMI dashboard prototype for an ESP32 multi-channel data acquisition unit monitoring a single-phase AC motor / pump test rig.
**Engineering Technology — Bahrain Polytechnic**

**Team:** Abdulla Zuhiar (202301078) · Jasim Hayyan (202303646) · Abdulla Marhoon (202303667)

## Features
- Live telemetry cards: current (ACS712), voltage (ZMPT101B), temperature (GY-906), vibration (MPU6050)
- MCSA FFT spectrum with 50 Hz fundamental and sideband highlighting
- Time-domain features: RMS, kurtosis, power factor
- AI fault classification (Random Forest / SVM) with probability bars
- Fault injection simulator: run capacitor wear, dynamic rotor unbalance, flow restriction
- Emergency shutdown / relay trip with auto-trip and event log

Telemetry is **simulated**. To use real data, replace the `tick()` function in `src/App.jsx` with your ESP32 WebSocket or HTTP feed.

## Run locally
```bash
npm install
npm run dev
```

## Deploy
**GitHub:** create a new repository, then
```bash
git init
git add .
git commit -m "Initial commit: MCSA maintenance predictor dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/mcsa-predictor-dashboard.git
git push -u origin main
```
**Vercel:** go to vercel.com/new, import the GitHub repository and click Deploy. Vercel detects Vite automatically (build: `npm run build`, output: `dist`).

## Stack
React 18 · Vite 5 · Tailwind CSS 3
