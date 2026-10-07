import os
from motor.motor_asyncio import AsyncIOMotorClient
import hashlib
from dotenv import load_dotenv

load_dotenv()

async def seed_admin():
    try:
        print("Connecting to MongoDB...")
        MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client['liver_recurrence_net']
        users = db['users']
        
        # Test connection
        await client.server_info()
        print("Connected!")

        pwd_hash = hashlib.sha256('Admin@Hettiarachci#'.encode()).hexdigest()
        admin_doc = {
            'id': 'ST-ADMIN',
            'name': 'System Super Admin',
            'level': 'Super Admin',
            'email': 'admin@HepatoAI.com',
            'password_hash': pwd_hash,
            'status': 'Active',
            'first_login_skipped': True
        }
        
        await users.delete_many({'email': 'admin@HepatoAI.com'})
        await users.delete_many({'id': 'ST-ADMIN'})
        await users.insert_one(admin_doc)
        print('Super Admin seeded successfully with password Admin@Hettiarachci#!')
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_admin())
