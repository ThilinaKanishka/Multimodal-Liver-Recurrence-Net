import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://127.0.0.1:27017/', serverSelectionTimeoutMS=2000)
    db = client['liver_recurrence_net']
    try:
        users = await db.users.find({'email': 'admin@HepatoAI.com'}).to_list(100)
        for u in users:
            print(f"ID: {u.get('id')}, Level: {u.get('level')}, PwdHash: {u.get('password_hash')}")
    except Exception as e:
        print(e)

asyncio.run(check())
