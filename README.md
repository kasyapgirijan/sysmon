# System Pulse

System Pulse is a lightweight, real-time system monitoring tool designed to track and display running processes, CPU utilization, and memory consumption.

## Features

- **Process Monitoring**: Fetches real-time statistics for running system processes.
- **Smart Caching**: Efficiently monitors CPU usage deltas over time using `psutil`.
- **High Performance**: Optimizes kernel calls by fetching internal process information in single shots.
- **Containerized**: Fully Dockerized for rapid setup and deployment.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

There are two ways to run System Pulse, depending on your goal:

1.  **Via Docker:** The easiest method for deployment, especially on a Linux host.
2.  **Natively:** The **required** method if you want to monitor your host machine on Windows or macOS.

### Option 1: Running with Docker Compose (Linux Hosts)

This is the simplest way to run the application. On a Linux host, using `pid: "host"` in the `docker-compose.yml` file allows the container to see all processes on the host.

**Note:** On Windows and macOS, Docker runs in a lightweight Linux virtual machine. This means the container will only see the processes inside that VM, *not* your actual host system's processes (like Chrome, games, etc.). If you want to monitor your Windows/macOS processes, you must use Option 2.

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

### Option 2: Running Natively (for Windows & macOS Hosts)

To monitor your actual host machine, you must run the Python backend directly.

1.  **Set up a Python virtual environment:**
    ```bash
    # Create a virtual environment in the project root
    python -m venv venv

    # Activate the environment
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r backend/requirements.txt
    ```

3.  **Run the backend server:**
    This command assumes your main FastAPI file is `backend/main.py` and the app variable is `app`.
    ```bash
    uvicorn backend.main:app --host 0.0.0.0 --port 8882 --reload
    ```

4.  **View the frontend:**
    Once the server is running, open the `frontend/index.html` file in your web browser. It will automatically connect to the backend running on your host.

## Project Structure
- `backend/processes.py`: Core logic for scraping system metrics using `psutil`.
- `docker-compose.yml`: Deployment configuration.