import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URI)
db = client["liver_recurrence_net"]

# Collections
patients_collection = db["patients"]
audit_logs_collection = db["audit_logs"]
predictions_collection = db["predictions"]
users_collection = db["users"]
system_logs_collection = db["system_logs"]
messages_collection = db["messages"]
