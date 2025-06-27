from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the backend directory to the path so we can import from it
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.main import app as backend_app

# Create a new FastAPI app for Vercel
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routes from the backend app
app.include_router(backend_app.router)

# Add a health check endpoint
@app.get("/api/ping")
async def ping():
    return {"status": "ok"}

# For Vercel serverless functions
handler = app
