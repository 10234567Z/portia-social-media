#!/bin/bash

echo "Starting Content Creator API Server..."
echo "Installing dependencies..."
uv sync

echo "Starting server on http://localhost:8000"
uv run uvicorn server:app --host 0.0.0.0 --port 8000 --reload
