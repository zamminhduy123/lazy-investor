#!/bin/bash

# Activate the virtual environment if needed
# source /path/to/your/venv/bin/activate

# Run the FastAPI application using Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload