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


@app.post("/ai/chat")
async def ai_chat(request: Request):
    """Proxy Claude API calls using user-provided key."""
    import httpx
    body = await request.json()
    api_key = body.get("api_key", "")
    message = body.get("message", "")
    lang = body.get("lang", "en")

    if not api_key or not message:
        return {"error": "api_key and message required"}

    # Fetch store context
    try:
        async with async_session_factory() as db:
            from app.models import Product, Order
            products_result = await db.execute(select(Product).limit(10))
            products = [{"title": p.title, "inventory": p.inventory_total, "price_min": p.price_min} for p in products_result.scalars().all()]
            orders_result = await db.execute(select(func.count()).select_from(Order))
            order_count = orders_result.scalar() or 0
    except Exception:
        products = []
        order_count = 0

    system_prompt = f"""You are an AI CEO assistant for a Shopify store. Respond in {'Spanish' if lang == 'es' else 'English'}.
Store context: {len(products)} products, {order_count} orders.
Products: {products[:5]}
Give actionable, specific advice based on this data. Keep responses under 150 words."""

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 300,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": message}],
                },
                timeout=15.0,
            )
            data = resp.json()
            if "content" in data and len(data["content"]) > 0:
                return {"response": data["content"][0]["text"]}
            return {"error": data.get("error", {}).get("message", "Unknown error")}
    except Exception as exc:
        return {"error": str(exc)}


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
