import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import hashlib

async def reset():
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db = client['hepatoai_db']
    users = db['users']
    pwd_hash = hashlib.sha256('1234'.encode()).hexdigest()
    result = await users.update_one({'email': 'admin@HepatoAI.com'}, {'$set': {'password_hash': pwd_hash}})
    print(f"Matched: {result.matched_count}, Modified: {result.modified_count}")

asyncio.run(reset())
