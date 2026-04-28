# Sysmon Lite

Sysmon Lite is a lightweight, real-time system monitoring tool designed to track and display running processes, CPU utilization, and memory consumption.

## Features

- **Process Monitoring**: Fetches real-time statistics for running system processes.
- **Smart Caching**: Efficiently monitors CPU usage deltas over time using `psutil`.
- **High Performance**: Optimizes kernel calls by fetching internal process information in single shots.
- **Containerized**: Fully Dockerized for rapid setup and deployment.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### Running with Docker Compose

The easiest way to run Sysmon Lite is via Docker Compose. The container is configured to share the host's PID namespace, allowing it to correctly read system-wide process metrics.

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sysmon
   ```

2. Start the service:
   ```bash
   docker-compose up -d --build
   ```

3. The service will be available on port `8882`.

## Project Structure
- `backend/processes.py`: Core logic for scraping system metrics using `psutil`.
- `docker-compose.yml`: Deployment configuration.