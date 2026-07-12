import os
import sys
import requests
import time
from pathlib import Path

# Configuration
API_URL = "http://localhost:8000/api/ingestion/upload"
SUPPORTED_EXTENSIONS = {'.pdf', '.txt', '.xlsx', '.csv', '.md'}

def upload_file(filepath: Path):
    print(f"\nUploading: {filepath.name}...")
    try:
        with open(filepath, 'rb') as f:
            files = {'file': (filepath.name, f)}
            data = {
                'source_system': 'BulkUploader',
                'plant': 'Dataset_Test',
                'doc_type': 'Dataset'
            }
            
            response = requests.post(API_URL, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Success! Doc ID: {result.get('doc_id')}")
            else:
                print(f"❌ Failed ({response.status_code}): {response.text}")
                
    except Exception as e:
        print(f"❌ Error uploading {filepath.name}: {e}")

def process_directory(directory_path: str):
    path = Path(directory_path)
    if not path.exists() or not path.is_dir():
        print(f"Error: Directory '{directory_path}' does not exist.")
        sys.exit(1)
        
    files_to_process = [f for f in path.rglob('*') if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS]
    
    if not files_to_process:
        print(f"No supported files found in {directory_path}.")
        print(f"Supported extensions: {', '.join(SUPPORTED_EXTENSIONS)}")
        sys.exit(0)
        
    print(f"Found {len(files_to_process)} files to upload. Starting in 3 seconds...")
    time.sleep(3)
    
    for i, file_path in enumerate(files_to_process, 1):
        print(f"--- File {i}/{len(files_to_process)} ---")
        upload_file(file_path)
        time.sleep(1) # Brief pause to not overwhelm local Docker

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python bulk_upload.py <path_to_dataset_folder>")
        sys.exit(1)
        
    dataset_dir = sys.argv[1]
    process_directory(dataset_dir)
