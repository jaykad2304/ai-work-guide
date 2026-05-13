from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.database import init_db
from backend.config import config
from backend.routes import timeline, search, insights, export
from backend.models import Event

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
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(timeline.router)
app.include_router(search.router)
app.include_router(insights.router)
app.include_router(export.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/rescan")
async def rescan_claude_cli(db = None):
    """Scan Claude CLI for AI tool usage"""
    from backend.database import SessionLocal
    from backend.parsers.claude_cli_parser import ClaudeCliParser

    db = SessionLocal()
    try:
        # Parse Claude CLI sessions
        cli_parser = ClaudeCliParser(db)
        cli_events = cli_parser.parse_all_sessions()
        print(f"✓ Parsed {len(cli_events)} Claude CLI sessions")

        # Update metadata
        cli_parser.update_daily_metadata()

        return {
            "status": "success",
            "parsed_cli_events": len(cli_events),
            "total_events": len(cli_events),
            "message": f"Parsed {len(cli_events)} Claude CLI sessions"
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
