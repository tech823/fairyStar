"""
Fairy Star Vacation Homes - Cloud Storage Service
Handles media uploads to Cloudflare R2 / AWS S3
"""

import os
import uuid
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Storage configuration from environment
STORAGE_PROVIDER = os.environ.get("STORAGE_PROVIDER", "r2")  # r2 or s3
S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "")
S3_BUCKET = os.environ.get("S3_BUCKET", "fairystar-media")
S3_ACCESS_KEY_ID = os.environ.get("S3_ACCESS_KEY_ID", "")
S3_SECRET_ACCESS_KEY = os.environ.get("S3_SECRET_ACCESS_KEY", "")
S3_REGION = os.environ.get("S3_REGION", "auto")
PUBLIC_CDN_BASE_URL = os.environ.get("PUBLIC_CDN_BASE_URL", "")
STORAGE_ENABLED = os.environ.get("STORAGE_ENABLED", "false").lower() == "true"

# File limits
MAX_IMAGE_SIZE_MB = 10
MAX_VIDEO_SIZE_MB = 200
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"}

# Thumbnail sizes
THUMBNAIL_SIZES = {
    "thumb": (200, 200),
    "medium": (800, 600),
    "large": (1920, 1080)
}


def get_s3_client():
    """Get boto3 S3 client configured for R2 or AWS S3"""
    if not S3_ACCESS_KEY_ID or not S3_SECRET_ACCESS_KEY:
        return None
    
    config = Config(
        signature_version='s3v4',
        retries={'max_attempts': 3}
    )
    
    client_kwargs = {
        "aws_access_key_id": S3_ACCESS_KEY_ID,
        "aws_secret_access_key": S3_SECRET_ACCESS_KEY,
        "config": config
    }
    
    if STORAGE_PROVIDER == "r2" and S3_ENDPOINT:
        client_kwargs["endpoint_url"] = S3_ENDPOINT
        client_kwargs["region_name"] = "auto"
    elif S3_REGION:
        client_kwargs["region_name"] = S3_REGION
    
    return boto3.client("s3", **client_kwargs)


class StorageService:
    """Cloud storage service for managing property media"""
    
    def __init__(self, db):
        self.db = db
        self.enabled = STORAGE_ENABLED
        self.client = get_s3_client() if self.enabled else None
        self.bucket = S3_BUCKET
        self.cdn_base = PUBLIC_CDN_BASE_URL.rstrip("/") if PUBLIC_CDN_BASE_URL else ""
    
    def is_configured(self) -> bool:
        """Check if storage is properly configured"""
        return bool(self.client and self.bucket and self.cdn_base)
    
    def get_config_status(self) -> Dict[str, Any]:
        """Get storage configuration status"""
        return {
            "enabled": self.enabled,
            "provider": STORAGE_PROVIDER,
            "bucket": S3_BUCKET if S3_BUCKET else "Not set",
            "cdn_base": PUBLIC_CDN_BASE_URL if PUBLIC_CDN_BASE_URL else "Not set",
            "configured": self.is_configured(),
            "max_image_size_mb": MAX_IMAGE_SIZE_MB,
            "max_video_size_mb": MAX_VIDEO_SIZE_MB,
            "allowed_image_types": list(ALLOWED_IMAGE_TYPES),
            "allowed_video_types": list(ALLOWED_VIDEO_TYPES)
        }
    
    def validate_file(self, filename: str, content_type: str, size_bytes: int) -> Tuple[bool, str]:
        """Validate file before upload"""
        # Check extension
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        
        # Check content type
        is_image = content_type in ALLOWED_IMAGE_TYPES
        is_video = content_type in ALLOWED_VIDEO_TYPES
        
        if not is_image and not is_video:
            return False, f"Invalid content type: {content_type}"
        
        # Check size
        size_mb = size_bytes / (1024 * 1024)
        if is_image and size_mb > MAX_IMAGE_SIZE_MB:
            return False, f"Image too large. Max size: {MAX_IMAGE_SIZE_MB}MB"
        if is_video and size_mb > MAX_VIDEO_SIZE_MB:
            return False, f"Video too large. Max size: {MAX_VIDEO_SIZE_MB}MB"
        
        return True, "Valid"
    
    def generate_storage_key(self, property_id: str, filename: str, media_type: str = "images") -> str:
        """Generate structured storage key/path"""
        ext = Path(filename).suffix.lower()
        unique_id = str(uuid.uuid4())
        return f"properties/{property_id}/{media_type}/{unique_id}{ext}"
    
    async def generate_presigned_upload_url(
        self, 
        property_id: str, 
        filename: str, 
        content_type: str,
        size_bytes: int
    ) -> Dict[str, Any]:
        """Generate a pre-signed URL for direct upload to S3/R2"""
        if not self.enabled:
            return {"error": "Storage not enabled", "status": "disabled"}
        
        if not self.is_configured():
            return {"error": "Storage not configured", "status": "not_configured"}
        
        # Validate file
        valid, message = self.validate_file(filename, content_type, size_bytes)
        if not valid:
            return {"error": message, "status": "validation_error"}
        
        # Determine media type
        is_video = content_type in ALLOWED_VIDEO_TYPES
        media_type = "videos" if is_video else "images"
        
        # Generate storage key
        storage_key = self.generate_storage_key(property_id, filename, media_type)
        
        try:
            # Generate pre-signed URL (valid for 1 hour)
            presigned_url = await asyncio.to_thread(
                self.client.generate_presigned_url,
                "put_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": storage_key,
                    "ContentType": content_type
                },
                ExpiresIn=3600
            )
            
            # Public URL for accessing the file after upload
            public_url = f"{self.cdn_base}/{storage_key}"
            
            return {
                "status": "success",
                "upload_url": presigned_url,
                "storage_key": storage_key,
                "public_url": public_url,
                "content_type": content_type,
                "media_type": "video" if is_video else "image",
                "expires_in": 3600
            }
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            return {"error": str(e), "status": "error"}
    
    async def confirm_upload(
        self,
        property_id: str,
        storage_key: str,
        public_url: str,
        media_type: str,
        caption: Optional[str] = None,
        alt_text: Optional[str] = None,
        is_cover: bool = False,
        video_link: Optional[str] = None
    ) -> Dict[str, Any]:
        """Confirm upload and store metadata in database"""
        
        # Get current property media to determine order
        # Include 'id' in projection to verify property exists even if media field is missing
        prop = await self.db.properties.find_one({"id": property_id}, {"_id": 0, "id": 1, "media": 1})
        if not prop or not prop.get("id"):
            return {"error": "Property not found", "status": "error"}
        
        current_media = prop.get("media", [])
        order = len(current_media)
        
        # Create media record
        media_id = str(uuid.uuid4())
        media_record = {
            "id": media_id,
            "type": media_type,
            "url": public_url,
            "storage_key": storage_key,
            "video_link": video_link,
            "thumbnail": None,
            "caption": caption,
            "alt_text": alt_text,
            "is_cover": is_cover,
            "order": order,
            "size_bytes": 0,  # Will be updated if we check
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # If setting as cover, unset other covers
        if is_cover and current_media:
            for m in current_media:
                m["is_cover"] = False
        
        # Add to property
        await self.db.properties.update_one(
            {"id": property_id},
            {
                "$push": {"media": media_record},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        # Also add to images array for backward compatibility
        if media_type == "image":
            await self.db.properties.update_one(
                {"id": property_id},
                {"$push": {"images": public_url}}
            )
        
        logger.info(f"Media confirmed: {media_id} for property {property_id}")
        return {"status": "success", "media": media_record}
    
    async def delete_media(self, property_id: str, media_id: str) -> Dict[str, Any]:
        """Delete media from storage and database"""
        # Get property and find the media
        # Include 'id' in projection to verify property exists even if media field is missing
        prop = await self.db.properties.find_one({"id": property_id}, {"_id": 0, "id": 1, "media": 1})
        if not prop or not prop.get("id"):
            return {"error": "Property not found", "status": "error"}
        
        media_to_delete = None
        for m in prop.get("media", []):
            if m.get("id") == media_id:
                media_to_delete = m
                break
        
        if not media_to_delete:
            return {"error": "Media not found", "status": "error"}
        
        storage_key = media_to_delete.get("storage_key")
        public_url = media_to_delete.get("url")
        
        # Delete from S3/R2 if we have a storage key
        if storage_key and self.is_configured():
            try:
                await asyncio.to_thread(
                    self.client.delete_object,
                    Bucket=self.bucket,
                    Key=storage_key
                )
                logger.info(f"Deleted from storage: {storage_key}")
            except ClientError as e:
                logger.error(f"Error deleting from storage: {e}")
                # Continue anyway to remove from DB
        
        # Remove from database
        await self.db.properties.update_one(
            {"id": property_id},
            {
                "$pull": {
                    "media": {"id": media_id},
                    "images": public_url
                },
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        logger.info(f"Media deleted: {media_id} from property {property_id}")
        return {"status": "success", "deleted_id": media_id}
    
    async def reorder_media(self, property_id: str, media_order: list) -> Dict[str, Any]:
        """Reorder media gallery"""
        # Include 'id' in projection to verify property exists even if media field is missing
        prop = await self.db.properties.find_one({"id": property_id}, {"_id": 0, "id": 1, "media": 1})
        if not prop or not prop.get("id"):
            return {"error": "Property not found", "status": "error"}
        
        current_media = prop.get("media", [])
        media_dict = {m["id"]: m for m in current_media}
        
        # Reorder
        reordered = []
        for i, media_id in enumerate(media_order):
            if media_id in media_dict:
                media_dict[media_id]["order"] = i
                media_dict[media_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
                reordered.append(media_dict[media_id])
        
        # Add any missing items at the end
        for m in current_media:
            if m["id"] not in media_order:
                m["order"] = len(reordered)
                reordered.append(m)
        
        # Update images array to match new order
        images = [m["url"] for m in reordered if m.get("type") == "image"]
        
        await self.db.properties.update_one(
            {"id": property_id},
            {
                "$set": {
                    "media": reordered,
                    "images": images,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {"status": "success", "media": reordered}
    
    async def set_cover_image(self, property_id: str, media_id: str) -> Dict[str, Any]:
        """Set a specific media as the cover image"""
        # Include 'id' in projection to verify property exists even if media field is missing
        prop = await self.db.properties.find_one({"id": property_id}, {"_id": 0, "id": 1, "media": 1})
        if not prop or not prop.get("id"):
            return {"error": "Property not found", "status": "error"}
        
        current_media = prop.get("media", [])
        found = False
        
        for m in current_media:
            if m["id"] == media_id:
                m["is_cover"] = True
                found = True
            else:
                m["is_cover"] = False
            m["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        if not found:
            return {"error": "Media not found", "status": "error"}
        
        await self.db.properties.update_one(
            {"id": property_id},
            {"$set": {"media": current_media, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"status": "success", "cover_id": media_id}
    
    async def update_media_metadata(
        self,
        property_id: str,
        media_id: str,
        caption: Optional[str] = None,
        alt_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update media caption and alt text"""
        # Include 'id' in projection to verify property exists even if media field is missing
        prop = await self.db.properties.find_one({"id": property_id}, {"_id": 0, "id": 1, "media": 1})
        if not prop or not prop.get("id"):
            return {"error": "Property not found", "status": "error"}
        
        current_media = prop.get("media", [])
        found = False
        
        for m in current_media:
            if m["id"] == media_id:
                if caption is not None:
                    m["caption"] = caption
                if alt_text is not None:
                    m["alt_text"] = alt_text
                m["updated_at"] = datetime.now(timezone.utc).isoformat()
                found = True
                break
        
        if not found:
            return {"error": "Media not found", "status": "error"}
        
        await self.db.properties.update_one(
            {"id": property_id},
            {"$set": {"media": current_media, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"status": "success"}
    
    async def add_video_link(
        self,
        property_id: str,
        video_link: str,
        thumbnail_url: Optional[str] = None,
        caption: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add a video via external link (YouTube/Vimeo)"""
        # Include 'id' in projection to verify property exists even if media field is missing
        prop = await self.db.properties.find_one({"id": property_id}, {"_id": 0, "id": 1, "media": 1})
        if not prop or not prop.get("id"):
            return {"error": "Property not found", "status": "error"}
        
        current_media = prop.get("media", [])
        order = len(current_media)
        
        media_id = str(uuid.uuid4())
        media_record = {
            "id": media_id,
            "type": "video",
            "url": thumbnail_url or "",
            "storage_key": None,
            "video_link": video_link,
            "thumbnail": thumbnail_url,
            "caption": caption,
            "alt_text": caption,
            "is_cover": False,
            "order": order,
            "size_bytes": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.properties.update_one(
            {"id": property_id},
            {
                "$push": {"media": media_record},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        return {"status": "success", "media": media_record}
    
    async def generate_thumbnail(self, image_data: bytes, size: Tuple[int, int] = (200, 200)) -> bytes:
        """Generate thumbnail from image data"""
        try:
            def _process():
                img = Image.open(io.BytesIO(image_data))
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                # Resize maintaining aspect ratio
                img.thumbnail(size, Image.Resampling.LANCZOS)
                # Save to bytes
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=85)
                return output.getvalue()
            
            return await asyncio.to_thread(_process)
        except Exception as e:
            logger.error(f"Error generating thumbnail: {e}")
            return None
    
    async def strip_exif(self, image_data: bytes) -> bytes:
        """Strip EXIF data from image for privacy"""
        try:
            def _process():
                img = Image.open(io.BytesIO(image_data))
                # Create new image without EXIF
                data = list(img.getdata())
                img_no_exif = Image.new(img.mode, img.size)
                img_no_exif.putdata(data)
                # Save to bytes
                output = io.BytesIO()
                format = 'JPEG' if img.format in ('JPEG', 'JPG') else img.format or 'JPEG'
                img_no_exif.save(output, format=format, quality=95)
                return output.getvalue()
            
            return await asyncio.to_thread(_process)
        except Exception as e:
            logger.error(f"Error stripping EXIF: {e}")
            return image_data  # Return original if error
