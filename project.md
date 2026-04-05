# Infinite Scroll

A system that translates continuous digital scrolling into real-time physical output.

## Overview

Infinite Scroll captures user scroll behavior on a mobile device and materializes it through a thermal receipt printer. The system exposes otherwise invisible, habitual interactions as persistent physical traces.

## System Architecture


Mobile App (Expo)
↓
HTTP (scroll signals)
↓
Gateway (Node.js / TypeScript)
↓
TCP (ESC/POS)
↓
Thermal Printer


## Components

### 1. scroll-tracker-browser
Mobile application (Expo) that:
- Tracks scroll interactions
- Computes scroll distance and sessions
- Sends signals to the gateway

### 2. infinite-scroll-gateway
A lightweight gateway service that:
- Receives scroll signals via HTTP
- Buffers and transforms input
- Sends formatted output to a thermal printer

## Key Concepts

- **Translation**: Converting scroll gestures into printable patterns
- **Accumulation**: Continuous interaction becomes continuous paper output
- **Materialization**: Digital behavior becomes physical artifact

## Getting Started

### Run the Gateway


cd infinite-scroll-gateway
npm install
npm run dev


### Run the App


cd scroll-tracker-browser
npm install
npx expo start


Make sure:
- Phone and gateway are on the same network
- App points to the gateway IP (not localhost)

## Repository Structure


infinite-scroll/
├── infinite-scroll-gateway/
├── scroll-tracker-browser/
└── README.md


## Future Work

- Session-based summaries
- Scroll visualization patterns
- Replay from stored data
- Multi-printer / installation setup