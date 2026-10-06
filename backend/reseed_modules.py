import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGODB_URI'))
db = client['liver_recurrence_net']

DEFAULT_MODULES = [
    {"id": "workspace", "name": "Workspace", "enabled": True, "disabledReason": None, "disabledAt": None},
    {"id": "compare", "name": "Compare", "enabled": True, "disabledReason": None, "disabledAt": None},
    {"id": "dashboard", "name": "Dashboard", "enabled": True, "disabledReason": None, "disabledAt": None},
    {"id": "attention", "name": "Attention", "enabled": True, "disabledReason": None, "disabledAt": None},
    {"id": "features", "name": "Features", "enabled": True, "disabledReason": None, "disabledAt": None},
    {"id": "patient-history", "name": "Patient History", "enabled": True, "disabledReason": None, "disabledAt": None},
    {"id": "workload-logs", "name": "Workload Logs", "enabled": True, "disabledReason": None, "disabledAt": None},
    {"id": "settings", "name": "Settings", "enabled": True, "disabledReason": None, "disabledAt": None},
    {"id": "it-support", "name": "IT Support", "enabled": True, "disabledReason": None, "disabledAt": None}
]

async def seed():
    await db.modules.delete_many({})
    await db.modules.insert_many(DEFAULT_MODULES)
    print('Re-seeded modules collection successfully!')

asyncio.run(seed())
