import os
import boto3
from botocore.exceptions import ClientError

class DocumentStorage:
    def __init__(self):
        # We will point this to our local MinIO container by default, or AWS S3 in production
        self.endpoint_url = os.environ.get("S3_ENDPOINT", "http://localhost:9000")
        self.access_key = os.environ.get("S3_ACCESS_KEY", "minioadmin")
        self.secret_key = os.environ.get("S3_SECRET_KEY", "minioadmin123")
        self.bucket_name = os.environ.get("S3_BUCKET_NAME", "etgen-raw-docs")
        
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            # MinIO needs these settings
            config=boto3.session.Config(signature_version='s3v4'),
            region_name='us-east-1' # dummy region for MinIO
        )
        
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == '404':
                try:
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                except ClientError as create_e:
                    create_code = create_e.response.get('Error', {}).get('Code', '')
                    if create_code in ['BucketAlreadyOwnedByYou', 'BucketAlreadyExists']:
                        pass
                    else:
                        print(f"[Storage] Error creating bucket: {create_e}")
            else:
                print(f"[Storage] Error checking bucket: {e}")

    def upload_document(self, file_bytes: bytes, object_name: str, metadata: dict) -> str:
        """
        Uploads raw file bytes to S3/MinIO as immutable original.
        Returns the storage path (object_name).
        """
        try:
            # We store the metadata tags along with the object in S3
            # Convert metadata dict to strings for S3 tags
            str_metadata = {k: str(v) for k, v in metadata.items() if v is not None}
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=object_name,
                Body=file_bytes,
                Metadata=str_metadata
            )
            return object_name
        except ClientError as e:
            print(f"[Storage] Upload failed: {e}")
            raise

    def get_document(self, object_name: str) -> bytes:
        """
        Retrieves raw file bytes from S3/MinIO.
        """
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=object_name)
            return response['Body'].read()
        except ClientError as e:
            print(f"[Storage] Download failed for {object_name}: {e}")
            return None
