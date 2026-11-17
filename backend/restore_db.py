import json
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'fairy_star')

if not MONGO_URL:
    print("Error: MONGO_URL not found in .env file")
    exit(1)

# Initialize MongoDB Client
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Backup directory
BACKUP_DIR = ROOT_DIR.parent / 'db_backup_json'

def restore_collection(file_path):
    collection_name = file_path.stem
    print(f"Restoring collection: {collection_name}...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if not data:
            print(f"Collection {collection_name} is empty.")
            return

        # Prepare documents (strip MongoDB internal _id to avoid conflicts)
        for doc in data:
            if '_id' in doc:
                del doc['_id']
        
        # Insert data
        result = db[collection_name].insert_many(data)
        print(f"Successfully restored {len(result.inserted_ids)} documents to {collection_name}.")
        
    except Exception as e:
        print(f"Error restoring {collection_name}: {str(e)}")

def main():
    if not BACKUP_DIR.exists():
        print(f"Error: Backup directory not found at {BACKUP_DIR}")
        return

    json_files = list(BACKUP_DIR.glob('*.json'))
    if not json_files:
        print(f"Error: No JSON files found in {BACKUP_DIR}")
        return

    print(f"Starting database restore to {DB_NAME}...")
    
    # Priority order
    priority = ['admin_users', 'services', 'coordinators', 'properties']
    
    # Sort files: priority first, then others
    json_files.sort(key=lambda x: priority.index(x.stem) if x.stem in priority else 99)

    for file_path in json_files:
        restore_collection(file_path)

    print("\nDatabase restoration complete!")

if __name__ == "__main__":
    main()
