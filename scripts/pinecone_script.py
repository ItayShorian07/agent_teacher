import json
import os
import sys
import glob
import time
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 1. Environment & Configuration
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / ".env.local")

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
INDEX_HOST = os.getenv("PINECONE_INDEX_HOST", "https://agent-teacher-index-zugzqii.svc.aped-4627-b74a.pinecone.io")
NAMESPACE = os.getenv("PINECONE_NAMESPACE", "books_namespace") 

BOOKS_DIR = BASE_DIR / "data" / "books"
TEXT_FILES_PATH = str(BOOKS_DIR / "txt" / "*.txt")
JSON_METADATA_PATH = str(BOOKS_DIR / "metadata.json")

# Chunking Hyperparameters
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "25"))

if not PINECONE_API_KEY or PINECONE_API_KEY in ["your_pinecone_api_key_here", "API_KEY", ""]:
    print("\n[ERROR] PINECONE_API_KEY is missing or unset in your .env file!")
    print("Please open the '.env' file in your project root and set:")
    print("PINECONE_API_KEY=pcsk_your_actual_key_here\n")
    sys.exit(1)

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(host=INDEX_HOST)

# Initialize Text Splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    length_function=len,
    is_separator_regex=False,
)

# 2. Load Metadata
with open(JSON_METADATA_PATH, 'r', encoding='utf-8') as f:
    metadata_list = json.load(f)

# Key metadata by book integer string ID
metadata_dict = {str(item["id"]): item for item in metadata_list}

# 3. Process Text Files and Build Records
records_to_upsert = []

for filepath in glob.glob(TEXT_FILES_PATH):
    filename = os.path.basename(filepath)
    
    # Safely parse numeric book ID from filename (e.g. "01_grimms..." -> "1")
    file_id_str = str(int(filename.split('_')[0]))
    
    if file_id_str not in metadata_dict:
        print(f"Warning: No metadata found for file {filename}. Skipping.")
        continue

    file_metadata = metadata_dict[file_id_str]
    
    # Filter metadata for Pinecone compatibility (primitives & list of str only)
    clean_metadata = {}
    for k, v in file_metadata.items():
        if v is None:
            continue
        elif k == "authors" and isinstance(v, list):
            clean_metadata["authors"] = [a["name"] if isinstance(a, dict) and "name" in a else str(a) for a in v]
        elif isinstance(v, (str, int, float, bool, list)):
            clean_metadata[k] = v

    with open(filepath, 'r', encoding='utf-8') as f:
        file_content = f.read()

    chunks = text_splitter.split_text(file_content)

    for i, chunk in enumerate(chunks):
        record_id = f"{file_id_str}_chunk_{i}"
        
        record = {
            "_id": record_id,
            "text": chunk,
            "chunk_index": i,
            "total_chunks": len(chunks),
            **clean_metadata,
        }
        
        records_to_upsert.append(record)

print(f"Prepared {len(records_to_upsert)} chunks for upsert.")

# 4. Upsert Records to Pinecone
MAX_RETRIES = 4
for i in range(0, len(records_to_upsert), BATCH_SIZE):
    batch = records_to_upsert[i:i + BATCH_SIZE]
    batch_num = i // BATCH_SIZE + 1
    
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            index.upsert_records(namespace=NAMESPACE, records=batch)
            print(f"Upserted batch {batch_num}/{(len(records_to_upsert) + BATCH_SIZE - 1)//BATCH_SIZE} ({len(batch)} records)")
            break
        except Exception as e:
            error_msg = getattr(e, 'body', str(e))
            if attempt < MAX_RETRIES:
                wait_time = attempt * 10
                print(f"Batch {batch_num} rate-limit/auth pause (attempt {attempt}/{MAX_RETRIES}): {error_msg}. Waiting {wait_time}s...")
                time.sleep(wait_time)
                pc = Pinecone(api_key=PINECONE_API_KEY)
                index = pc.Index(host=INDEX_HOST)
            else:
                print(f"Error upserting batch {batch_num} after {MAX_RETRIES} attempts: {error_msg}")

    # Small delay between batches to stay under serverless inference limits
    time.sleep(0.5)

print("Upload complete!")