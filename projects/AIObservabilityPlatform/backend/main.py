from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.database import init_db
from backend.config import config
from backend.routes import timeline, search, insights, export, events, connectors
from backend.models import Event, DailyMetadata, Insight
from datetime import datetime, timezone

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("✓ Database initialized")
    yield
    print("✓ Server shutting down")

app = FastAPI(
    title="AI Observability Platform",
    description="Track and visualize all AI interactions",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(timeline.router)
app.include_router(search.router)
app.include_router(insights.router)
app.include_router(export.router)
app.include_router(events.router)
app.include_router(connectors.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/rescan")
async def rescan_all():
    """Scan all configured collectors for AI tool usage"""
    from backend.database import SessionLocal
    from backend.collectors.registry import load_collectors

    db = SessionLocal()
    try:
        collectors = load_collectors()
        total = 0
        by_tool = {}

        for collector in collectors:
            new_events = collector.parse_all(db)
            by_tool[collector.tool_name] = len(new_events)
            total += len(new_events)
            if len(new_events) > 0:
                print(f"✓ Parsed {len(new_events)} {collector.tool_name} sessions")

        return {
            "status": "success",
            "total_events": total,
            "by_tool": by_tool
        }
    finally:
        db.close()

@app.post("/reset-history")
async def reset_history():
    """Delete existing history and only track sessions from now onward."""
    from backend.database import SessionLocal

    cutoff = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        db.query(Insight).delete()
        db.query(DailyMetadata).delete()
        deleted_events = db.query(Event).delete()
        db.commit()
        config.set_tracking_cutoff(cutoff)

        return {
            "status": "success",
            "deleted_events": deleted_events,
            "tracking_from": cutoff.isoformat()
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
