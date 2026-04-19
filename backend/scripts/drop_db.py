from database import engine
from sqlalchemy import inspect, text

inspector = inspect(engine)
tables = inspector.get_table_names()

print("📋 Existing tables:")
if tables:
    for table in tables:
        print(f" - {table}")
else:
    print(" (no tables found)")

if tables:
    print("\n⚠️ Dropping all tables with CASCADE...")

    with engine.connect() as conn:
        for table in tables:
            conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
        conn.commit()

    print("✅ All tables dropped (CASCADE)")
else:
    print("\nNothing to drop 👍")