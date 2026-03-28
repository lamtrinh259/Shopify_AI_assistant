"""
Hackathon Backend — local-first FastAPI app.

Single-tenant, single-store, SQLite, no auth.
Start with: uvicorn backend.app.main:app --reload --port 8000
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func

from app.config import get_settings
from app.database import init_db, async_session_factory
from app.models import Product
from app.shopify import ShopifyClient
from app.sync import sync_all
from app.simulator import run_simulator
from app.routers import (
    store,
    products,
    orders,
    customers,
    inventory,
    analytics,
    events,
    actions,
    shopify_proxy,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, auto-sync if empty, start simulator."""
    # Init database tables
    await init_db()
    logger.info("Database initialized")

    # Create Shopify client
    settings = get_settings()
    client = ShopifyClient(
        store_url=settings.SHOPIFY_STORE_URL,
        access_token=settings.SHOPIFY_ACCESS_TOKEN,
        api_version=settings.SHOPIFY_API_VERSION,
    )
    app.state.shopify = client

    # Auto-sync if DB is empty
    async with async_session_factory() as db:
        result = await db.execute(select(func.count()).select_from(Product))
        count = result.scalar()
        if count == 0:
            logger.info("Empty database — syncing from Shopify...")
            try:
                await sync_all(db, client)
                await db.commit()
                logger.info("Initial sync complete")
            except Exception as exc:
                logger.error("Initial sync failed: %s — committing partial data", exc)
                try:
                    await db.commit()
                except Exception:
                    await db.rollback()

    # Start order simulator
    simulator_task = None
    if settings.SIMULATOR_ENABLED:
        simulator_task = asyncio.create_task(
            run_simulator(client, async_session_factory)
        )
        logger.info("Order simulator started")

    logger.info("Backend ready — %s", settings.SHOPIFY_STORE_URL)

    yield

    # Shutdown
    if simulator_task and not simulator_task.done():
        simulator_task.cancel()
        try:
            await simulator_task
        except asyncio.CancelledError:
            pass
    await client.client.aclose()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Hackathon Backend",
    description="Local-first Shopify backend for hackathon teams",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — wide open for localhost dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(store.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(customers.router)
app.include_router(inventory.router)
app.include_router(analytics.router)
app.include_router(events.router)
app.include_router(actions.router)
app.include_router(shopify_proxy.router)


@app.post("/configure")
async def configure_store(request: Request):
    """Update Shopify credentials, rewrite .env, and re-sync."""
    from pathlib import Path
    body = await request.json()
    token = body.get("access_token", "").strip()
    store_url = body.get("store_url", "").strip()

    if not token:
        return {"error": "access_token is required"}

    # Find and rewrite .env
    _backend_dir = Path(__file__).resolve().parent.parent
    _repo_root = _backend_dir.parent
    env_path = _repo_root / ".env"

    env_content = f"""SHOPIFY_ACCESS_TOKEN={token}
SHOPIFY_STORE_URL={store_url}
SIMULATOR_ENABLED=true
SIMULATOR_INTERVAL_MIN=60
SIMULATOR_INTERVAL_MAX=180
"""
    env_path.write_text(env_content)

    # Update the live client
    new_client = ShopifyClient(
        store_url=store_url,
        access_token=token,
        api_version="2025-01",
    )
    app.state.shopify = new_client

    # Re-sync
    try:
        async with async_session_factory() as db:
            await sync_all(db, new_client)
            await db.commit()
        return {"status": "ok", "message": f"Configured and synced {store_url}"}
    except Exception as exc:
        return {"status": "partial", "message": f"Configured but sync had errors: {exc}"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "hackathon-backend", "version": "2.0.0"}


@app.get("/")
async def root():
    """Root endpoint — same as health check."""
    return {"status": "ok", "service": "hackathon-backend", "version": "2.0.0"}
