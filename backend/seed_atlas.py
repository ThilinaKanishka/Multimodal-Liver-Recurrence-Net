from pymongo import MongoClient
import hashlib

print("Connecting to MongoDB Atlas...")
client = MongoClient('mongodb+srv://Admin:VeloceCarSalesThilina@cluster0.hl2apvt.mongodb.net/')
db = client['liver_recurrence_net']
users = db['users']

print("Connected!")
pwd_hash = hashlib.sha256('Admin@Hettiarachci#'.encode()).hexdigest()
admin_doc = {
    'id': 'ST-ADMIN',
    'name': 'System Admin',
    'level': 'IT Admin',
    'email': 'admin@HepatoAI.com',
    'password_hash': pwd_hash,
    'status': 'Active',
    'first_login_skipped': True
}

users.delete_many({'email': 'admin@HepatoAI.com'})
users.delete_many({'id': 'ST-ADMIN'})
users.insert_one(admin_doc)
print('Admin seeded successfully with password Admin@Hettiarachci#!')

# Verify
admin = users.find_one({'email': 'admin@HepatoAI.com'})
print("Verification:", admin['email'], admin['password_hash'])
