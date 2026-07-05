import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import hashlib

async def seed_admin():
    try:
        print("Connecting to MongoDB...")
        client = AsyncIOMotorClient('mongodb://127.0.0.1:27017/', serverSelectionTimeoutMS=5000)
        db = client['liver_recurrence_net']
        users = db['users']
        
        # Test connection
        await client.server_info()
        print("Connected!")

        pwd_hash = hashlib.sha256('1234'.encode()).hexdigest()
        admin_doc = {
            'id': 'ST-ADMIN',
            'name': 'System Admin',
            'level': 'IT Admin',
            'email': 'admin@HepatoAI.com',
            'password_hash': pwd_hash,
            'status': 'Active',
            'first_login_skipped': True
        }
        
        await users.delete_many({'email': 'admin@HepatoAI.com'})
        await users.delete_many({'id': 'ST-ADMIN'})
        await users.insert_one(admin_doc)
        print('Admin seeded successfully with password 1234!')
    except Exception as e:
        print("ERROR:", e)

asyncio.run(seed_admin())
