from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['liver_recurrence_net']
users = db['users']

admin = users.find_one({'id': 'ST-ADMIN'})
print('--- ADMIN DOC ---')
print('ID:', admin.get('id'))
print('Email:', admin.get('email'))
print('Hash:', admin.get('password_hash'))
