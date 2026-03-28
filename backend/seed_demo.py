"""
Seed the local SQLite database with realistic demo store data.
No Shopify token needed — writes directly to hackathon.db.

Usage: cd backend && python seed_demo.py
"""
import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from app.database import init_db, async_session_factory
from app.models import Product, Order, Customer, Event

# ── Products ──────────────────────────────────────────────────────────────

PRODUCTS = [
    {"title": "Classic Black T-Shirt", "handle": "classic-black-tshirt", "vendor": "UrbanBasics", "type": "Apparel", "price": 29.99, "stock": 45, "variants": [
        {"id": "v1a", "title": "S", "price": 29.99, "sku": "CBT-S", "inventory_quantity": 15},
        {"id": "v1b", "title": "M", "price": 29.99, "sku": "CBT-M", "inventory_quantity": 18},
        {"id": "v1c", "title": "L", "price": 29.99, "sku": "CBT-L", "inventory_quantity": 12},
    ]},
    {"title": "Minimalist Watch Silver", "handle": "minimalist-watch-silver", "vendor": "TimeCraft", "type": "Accessories", "price": 189.99, "stock": 8, "variants": [
        {"id": "v2", "title": "One Size", "price": 189.99, "sku": "MWS-01", "inventory_quantity": 8},
    ]},
    {"title": "Organic Cotton Hoodie", "handle": "organic-cotton-hoodie", "vendor": "EcoWear", "type": "Apparel", "price": 79.99, "stock": 32, "variants": [
        {"id": "v3a", "title": "S", "price": 79.99, "sku": "OCH-S", "inventory_quantity": 8},
        {"id": "v3b", "title": "M", "price": 79.99, "sku": "OCH-M", "inventory_quantity": 12},
        {"id": "v3c", "title": "L", "price": 79.99, "sku": "OCH-L", "inventory_quantity": 12},
    ]},
    {"title": "Leather Crossbody Bag", "handle": "leather-crossbody-bag", "vendor": "LeatherLux", "type": "Bags", "price": 124.99, "stock": 18, "variants": [
        {"id": "v4a", "title": "Black", "price": 124.99, "sku": "LCB-BLK", "inventory_quantity": 10},
        {"id": "v4b", "title": "Brown", "price": 124.99, "sku": "LCB-BRN", "inventory_quantity": 8},
    ]},
    {"title": "Wireless Earbuds Pro", "handle": "wireless-earbuds-pro", "vendor": "SoundMax", "type": "Electronics", "price": 149.99, "stock": 22, "variants": [
        {"id": "v5a", "title": "White", "price": 149.99, "sku": "WEP-WHT", "inventory_quantity": 12},
        {"id": "v5b", "title": "Black", "price": 149.99, "sku": "WEP-BLK", "inventory_quantity": 10},
    ]},
    {"title": "Running Shoes V2", "handle": "running-shoes-v2", "vendor": "StrideMax", "type": "Footwear", "price": 109.99, "stock": 35, "variants": [
        {"id": "v6a", "title": "US 8", "price": 109.99, "sku": "RSV2-8", "inventory_quantity": 8},
        {"id": "v6b", "title": "US 9", "price": 109.99, "sku": "RSV2-9", "inventory_quantity": 10},
        {"id": "v6c", "title": "US 10", "price": 109.99, "sku": "RSV2-10", "inventory_quantity": 9},
        {"id": "v6d", "title": "US 11", "price": 109.99, "sku": "RSV2-11", "inventory_quantity": 8},
    ]},
    {"title": "Ceramic Coffee Mug Set", "handle": "ceramic-coffee-mug-set", "vendor": "HomeStyle", "type": "Home", "price": 34.99, "stock": 62, "variants": [
        {"id": "v7a", "title": "Set of 2", "price": 34.99, "sku": "CCM-2", "inventory_quantity": 32},
        {"id": "v7b", "title": "Set of 4", "price": 54.99, "sku": "CCM-4", "inventory_quantity": 30},
    ]},
    {"title": "Stainless Water Bottle", "handle": "stainless-water-bottle", "vendor": "HydroLife", "type": "Accessories", "price": 24.99, "stock": 88, "variants": [
        {"id": "v8a", "title": "500ml", "price": 24.99, "sku": "SWB-500", "inventory_quantity": 45},
        {"id": "v8b", "title": "750ml", "price": 29.99, "sku": "SWB-750", "inventory_quantity": 43},
    ]},
    {"title": "Yoga Mat Premium", "handle": "yoga-mat-premium", "vendor": "ZenFit", "type": "Fitness", "price": 59.99, "stock": 25, "variants": [
        {"id": "v9", "title": "Standard", "price": 59.99, "sku": "YMP-01", "inventory_quantity": 25},
    ]},
    {"title": "Scented Candle Collection", "handle": "scented-candle-collection", "vendor": "AromaHome", "type": "Home", "price": 42.99, "stock": 40, "variants": [
        {"id": "v10a", "title": "Vanilla", "price": 42.99, "sku": "SCC-VAN", "inventory_quantity": 15},
        {"id": "v10b", "title": "Lavender", "price": 42.99, "sku": "SCC-LAV", "inventory_quantity": 13},
        {"id": "v10c", "title": "Eucalyptus", "price": 42.99, "sku": "SCC-EUC", "inventory_quantity": 12},
    ]},
]

# ── Customers ─────────────────────────────────────────────────────────────

CUSTOMERS = [
    {"first": "Sofia", "last": "Martinez", "email": "sofia@example.com", "orders": 12, "spent": 2840},
    {"first": "James", "last": "Chen", "email": "james.c@example.com", "orders": 9, "spent": 1920},
    {"first": "Emma", "last": "Wilson", "email": "emma.w@example.com", "orders": 11, "spent": 3100},
    {"first": "Lucas", "last": "Rivera", "email": "lucas.r@example.com", "orders": 6, "spent": 1450},
    {"first": "Aisha", "last": "Patel", "email": "aisha.p@example.com", "orders": 7, "spent": 1680},
    {"first": "Marco", "last": "Rossi", "email": "marco.r@example.com", "orders": 5, "spent": 1200},
    {"first": "Nina", "last": "Kowalski", "email": "nina.k@example.com", "orders": 8, "spent": 890},
    {"first": "David", "last": "Thompson", "email": "david.t@example.com", "orders": 6, "spent": 1340},
    {"first": "Yuki", "last": "Tanaka", "email": "yuki.t@example.com", "orders": 5, "spent": 720},
    {"first": "Chris", "last": "Baker", "email": "chris.b@example.com", "orders": 2, "spent": 180},
    {"first": "Laura", "last": "Kim", "email": "laura.k@example.com", "orders": 1, "spent": 95},
    {"first": "Tom", "last": "Nguyen", "email": "tom.n@example.com", "orders": 2, "spent": 210},
    {"first": "Sarah", "last": "Johnson", "email": "sarah.j@example.com", "orders": 4, "spent": 560},
    {"first": "Mike", "last": "Lee", "email": "mike.l@example.com", "orders": 3, "spent": 340},
    {"first": "Maria", "last": "Garcia", "email": "maria.g@example.com", "orders": 1, "spent": 89},
]


async def seed():
    await init_db()
    async with async_session_factory() as db:
        # Clear existing data
        from sqlalchemy import text
        for table in ['events', 'orders', 'customers', 'products']:
            await db.execute(text(f"DELETE FROM {table}"))

        now = datetime.now(timezone.utc)

        # ── Seed Products ──
        for i, p in enumerate(PRODUCTS):
            product = Product(
                id=f"gid://shopify/Product/{1000 + i}",
                title=p["title"],
                handle=p["handle"],
                status="active",
                vendor=p["vendor"],
                product_type=p["type"],
                price_min=p["price"],
                price_max=p["variants"][-1]["price"] if len(p["variants"]) > 1 else p["price"],
                variants=p["variants"],
                collections=[p["type"]],
                featured_image_url=None,
                inventory_total=p["stock"],
                created_at=(now - timedelta(days=random.randint(30, 120))).isoformat(),
                updated_at=(now - timedelta(hours=random.randint(1, 72))).isoformat(),
            )
            db.add(product)
        print(f"✓ Seeded {len(PRODUCTS)} products")

        # ── Seed Customers ──
        for i, c in enumerate(CUSTOMERS):
            days_ago = [3, 5, 2, 18, 22, 12, 55, 48, 62, 90, 120, 78, 8, 15, 35][i]
            customer = Customer(
                id=f"gid://shopify/Customer/{2000 + i}",
                email=c["email"],
                first_name=c["first"],
                last_name=c["last"],
                orders_count=c["orders"],
                total_spent=float(c["spent"]),
                tags=["vip"] if c["orders"] > 8 else [],
                created_at=(now - timedelta(days=random.randint(60, 365))).isoformat(),
                last_order_at=(now - timedelta(days=days_ago)).isoformat(),
            )
            db.add(customer)
        print(f"✓ Seeded {len(CUSTOMERS)} customers")

        # ── Seed Orders (90 days of history) ──
        order_count = 0
        statuses = ["paid", "paid", "paid", "paid", "pending", "refunded"]
        fulfillments = ["fulfilled", "fulfilled", "fulfilled", "partial", "unfulfilled", None]
        referrers = ["google.com", "instagram.com", "facebook.com", "tiktok.com", "direct", None]

        for day in range(90):
            date = now - timedelta(days=90 - day)
            # More orders on weekends, fewer midweek
            weekday = date.weekday()
            base_orders = 18 if weekday < 5 else 25
            daily_orders = base_orders + random.randint(-5, 8)

            for j in range(daily_orders):
                order_count += 1
                product = random.choice(PRODUCTS)
                variant = random.choice(product["variants"])
                qty = random.randint(1, 3)
                price = variant["price"] * qty
                tax = round(price * 0.08, 2)
                discount = round(price * 0.1, 2) if random.random() < 0.15 else 0
                total = round(price + tax - discount, 2)
                customer = random.choice(CUSTOMERS)
                hour = random.choices(range(24), weights=[
                    2, 1, 1, 1, 2, 3, 5, 8, 12, 15, 18, 20, 22, 19, 16, 14, 13, 15, 18, 16, 12, 8, 5, 3
                ])[0]
                order_time = date.replace(hour=hour, minute=random.randint(0, 59))

                order = Order(
                    id=f"gid://shopify/Order/{3000 + order_count}",
                    order_number=f"#{1000 + order_count}",
                    total_price=total,
                    subtotal_price=price,
                    total_discounts=discount,
                    total_tax=tax,
                    currency="USD",
                    financial_status=random.choice(statuses),
                    fulfillment_status=random.choice(fulfillments),
                    line_items=[{
                        "title": product["title"],
                        "variant_title": variant["title"],
                        "quantity": qty,
                        "price": variant["price"],
                    }],
                    customer_id=f"gid://shopify/Customer/{2000 + CUSTOMERS.index(customer)}",
                    customer_email=customer["email"],
                    customer_name=f"{customer['first']} {customer['last']}",
                    discount_codes=["HACK10"] if discount > 0 else [],
                    landing_site="/",
                    referring_site=random.choice(referrers),
                    processed_at=order_time.isoformat(),
                    created_at=order_time.isoformat(),
                    is_simulated=True,
                )
                db.add(order)

        print(f"✓ Seeded {order_count} orders (90 days)")

        # ── Seed recent events ──
        for i in range(20):
            mins_ago = i * 3 + random.randint(0, 2)
            event_time = now - timedelta(minutes=mins_ago)
            event_types = ["new_order", "new_order", "new_order", "customer_created", "inventory_change"]
            etype = random.choice(event_types)
            product = random.choice(PRODUCTS)

            if etype == "new_order":
                payload = {"order_number": str(1000 + order_count - i), "total_price": round(random.uniform(25, 250), 2)}
            elif etype == "customer_created":
                payload = {"email": random.choice(CUSTOMERS)["email"]}
            else:
                payload = {"product_title": product["title"]}

            event = Event(
                id=str(uuid.uuid4()),
                event_type=etype,
                payload=payload,
                created_at=event_time.isoformat(),
            )
            db.add(event)

        print(f"✓ Seeded 20 recent events")

        await db.commit()
        print(f"\n🎉 Demo store seeded! Total: {len(PRODUCTS)} products, {len(CUSTOMERS)} customers, {order_count} orders")
        print("   Restart the backend to see the data: cd backend && python -m uvicorn app.main:app --reload --port 8000")


if __name__ == "__main__":
    asyncio.run(seed())
