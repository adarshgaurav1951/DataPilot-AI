from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.api.routes import router as api_router
from backend.api.auth_routes import router as auth_router
from backend.api.billing_routes import router as billing_router
from backend.core.config import get_settings
from backend.core.logging import logger, setup_logging
from backend.db.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize logging & database
    setup_logging(level="DEBUG" if settings.DEBUG else "INFO")
    logger.info("Initializing DataPilot AI backend database tables...")
    init_db()
    logger.info(f"DataPilot AI backend ready. LLM Provider: {settings.resolved_llm_provider()}")
    yield
    # Shutdown
    logger.info("Shutting down DataPilot AI backend...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="DataPilot AI — Autonomous Data Analyst AI Agent with deterministic calculations, LangGraph orchestration, and interactive analytics.",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected server error occurred during data analysis.",
            "detail": str(exc) if settings.DEBUG else None,
        },
    )


# Health Endpoint
@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "llm_provider": settings.resolved_llm_provider(),
        "database": "PostgreSQL" if "postgresql" in settings.DATABASE_URL.lower() else "SQLite",
        "limits": {
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
            "max_rows": settings.MAX_ROWS,
            "max_columns": settings.MAX_COLUMNS,
        },
    }


# Include Modular API Routers
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(billing_router)


