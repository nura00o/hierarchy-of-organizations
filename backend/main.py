from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.units import router as units_router
from .routers.export import router as export_router

app = FastAPI(title="Organization Hierarchy API", version="0.1.0")

# Allow all origins for now. Adjust in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(units_router, prefix="/api")
app.include_router(export_router, prefix="/api")


@app.get("/ping")
async def ping():
    return {"status": "ok"}
