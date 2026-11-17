from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header, UploadFile, File, Form, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)
import base64
import aiofiles
import httpx

ROOT_DIR = Path(__file__).parent
# Load .env as fallback only - do NOT override existing environment variables
# Emergent secrets (runtime env vars) take precedence over .env file
# Production will inject real secrets; preview uses placeholders
load_dotenv(ROOT_DIR / '.env', override=False)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'fairy_star_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Fairy Star Vacation Homes API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Media storage directory
MEDIA_DIR = ROOT_DIR / "media"
MEDIA_DIR.mkdir(exist_ok=True)

# Initialize Email Service
from email_service import EmailService
email_service = EmailService(db)

# Initialize Storage Service
from storage_service import StorageService
storage_service = StorageService(db)

# ==================== MODELS ====================

# User Roles
ROLES = {
    "admin": ["all"],
    "operations": ["properties", "media", "pricing", "availability", "leads"],
    "coordinator": ["bookings_view", "guest_contact"],
    "finance": ["bookings_view", "payments", "exports"]
}

# Property Models
class PropertyPricing(BaseModel):
    nightly: float
    monthly: float = 0.0
    cleaning_fee: float = 50.0
    service_fee_percent: float = 10.0
    security_deposit: float = 0.0
    weekly_discount: float = 0.0
    monthly_discount: float = 0.0
    minimum_nights: int = 1
    maximum_nights: int = 365
    taxes_percent: float = 5.0

class PropertyMedia(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    type: str = "image"  # image, video
    video_link: Optional[str] = None
    thumbnail: Optional[str] = None
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    is_cover: bool = False
    order: int = 0

class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: Optional[str] = None
    description: str
    full_description: Optional[str] = None
    property_type: str
    city: str
    area: Optional[str] = None
    address: str
    internal_address: Optional[str] = None
    map_lat: Optional[float] = None
    map_lng: Optional[float] = None
    bedrooms: int
    beds: int = 0
    bed_type: Optional[str] = None
    bathrooms: int
    max_guests: int
    images: List[str] = []
    media: List[PropertyMedia] = []
    amenities: List[str] = []
    house_rules: Optional[str] = None
    check_in_time: str = "15:00"
    check_out_time: str = "11:00"
    pricing: PropertyPricing
    badges: List[str] = []
    is_featured: bool = False
    is_active: bool = True
    status: str = "published"  # draft, published
    suitable_for: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PropertyCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    description: str
    full_description: Optional[str] = None
    property_type: str
    city: str
    area: Optional[str] = None
    address: str
    internal_address: Optional[str] = None
    map_lat: Optional[float] = None
    map_lng: Optional[float] = None
    bedrooms: int
    beds: int = 0
    bed_type: Optional[str] = None
    bathrooms: int
    max_guests: int
    images: List[str] = []
    amenities: List[str] = []
    house_rules: Optional[str] = None
    check_in_time: str = "15:00"
    check_out_time: str = "11:00"
    pricing: PropertyPricing
    badges: List[str] = []
    is_featured: bool = False
    suitable_for: List[str] = []
    status: str = "published"

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    full_description: Optional[str] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    internal_address: Optional[str] = None
    map_lat: Optional[float] = None
    map_lng: Optional[float] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bed_type: Optional[str] = None
    bathrooms: Optional[int] = None
    max_guests: Optional[int] = None
    amenities: Optional[List[str]] = None
    house_rules: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    pricing: Optional[PropertyPricing] = None
    badges: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    suitable_for: Optional[List[str]] = None
    status: Optional[str] = None

# Availability Block Model
class AvailabilityBlock(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    start_date: str
    end_date: str
    reason: str = "blocked"  # blocked, maintenance, owner_stay, booking
    note: Optional[str] = None
    booking_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AvailabilityBlockCreate(BaseModel):
    start_date: str
    end_date: str
    reason: str = "blocked"
    note: Optional[str] = None

# Coordinator Model
class Coordinator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    is_active: bool = True
    assigned_bookings: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CoordinatorCreate(BaseModel):
    name: str
    email: str
    phone: str

# Add-on Service Models
class AddOnService(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    price: float
    price_type: str
    icon: str
    is_active: bool = True

# Service Request Model
class ServiceRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: Optional[str] = None
    lead_id: Optional[str] = None
    service_type: str  # tour, car_rental, visa, flight
    service_name: str
    guest_name: str
    guest_email: str
    guest_phone: str
    details: Optional[str] = None
    status: str = "requested"  # requested, quoted, confirmed, completed, cancelled
    quoted_price: Optional[float] = None
    notes: Optional[str] = None
    coordinator_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceRequestCreate(BaseModel):
    booking_id: Optional[str] = None
    lead_id: Optional[str] = None
    service_type: str
    service_name: str
    guest_name: str
    guest_email: str
    guest_phone: str
    details: Optional[str] = None

# Lead/Inquiry Models
class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_type: str
    name: str
    email: str
    phone: str
    city: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    guests: Optional[int] = None
    purpose: Optional[str] = None
    stay_type: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    add_ons: List[str] = []
    message: Optional[str] = None
    status: str = "new"
    notes: Optional[str] = None
    coordinator_id: Optional[str] = None
    source: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    lead_type: str
    name: str
    email: str
    phone: str
    city: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    guests: Optional[int] = None
    purpose: Optional[str] = None
    stay_type: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    add_ons: List[str] = []
    message: Optional[str] = None
    source: Optional[str] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    coordinator_id: Optional[str] = None

# Booking Models
class BookingAddOn(BaseModel):
    service_id: str
    name: str
    price: float
    quantity: int = 1

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    property_title: str
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in: str
    check_out: str
    guests: int
    nights: int
    base_price: float
    cleaning_fee: float
    service_fee: float
    taxes: float = 0.0
    add_ons: List[BookingAddOn] = []
    add_ons_total: float = 0.0
    total_amount: float
    deposit_amount: float
    payment_type: str
    payment_status: str = "pending"
    booking_status: str = "pending"
    stripe_session_id: Optional[str] = None
    stripe_payment_intent: Optional[str] = None
    coordinator_id: Optional[str] = None
    coordinator_name: Optional[str] = None
    special_requests: Optional[str] = None
    internal_notes: Optional[str] = None
    payment_confirmed_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    property_id: str
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in: str
    check_out: str
    guests: int
    add_ons: List[BookingAddOn] = []
    payment_type: str = "deposit"
    special_requests: Optional[str] = None

class BookingUpdate(BaseModel):
    booking_status: Optional[str] = None
    coordinator_id: Optional[str] = None
    internal_notes: Optional[str] = None

# Payment Transaction Model
class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    session_id: str
    amount: float
    currency: str = "aed"
    payment_status: str = "initiated"
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Admin User Model with Roles
class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    role: str = "admin"  # admin, operations, coordinator, finance
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "admin"

# Audit Log Model
class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    action: str  # create, update, delete
    entity_type: str  # property, booking, lead, pricing
    entity_id: str
    changes: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.admin_users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_permission(user: dict, required_permission: str):
    role = user.get("role", "")
    permissions = ROLES.get(role, [])
    if "all" in permissions or required_permission in permissions:
        return True
    raise HTTPException(status_code=403, detail="Insufficient permissions")

async def log_audit(user: dict, action: str, entity_type: str, entity_id: str, changes: dict = {}):
    audit = AuditLog(
        user_id=user["id"],
        user_email=user["email"],
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes
    )
    doc = audit.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.audit_logs.insert_one(doc)

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Fairy Star Vacation Homes API", "version": "2.0.0"}

# ========== RATE LIMITER ==========
from collections import defaultdict
import time

class RateLimiter:
    """Simple in-memory rate limiter for admin test endpoints."""
    def __init__(self, max_requests: int = 5, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
    
    def is_allowed(self, user_id: str) -> tuple[bool, int]:
        """Check if request is allowed. Returns (allowed, seconds_until_reset)."""
        now = time.time()
        # Clean old requests
        self.requests[user_id] = [t for t in self.requests[user_id] if now - t < self.window_seconds]
        
        if len(self.requests[user_id]) >= self.max_requests:
            oldest = min(self.requests[user_id])
            seconds_until_reset = int(self.window_seconds - (now - oldest)) + 1
            return False, seconds_until_reset
        
        self.requests[user_id].append(now)
        return True, 0

# Rate limiters for test endpoints (5 requests per minute per user)
storage_test_limiter = RateLimiter(max_requests=5, window_seconds=60)
email_test_limiter = RateLimiter(max_requests=5, window_seconds=60)

def check_admin_only(current_user: dict, action: str):
    """Restrict action to admin role only."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail=f"Only admins can {action}")

@api_router.get("/health/config")
async def health_config():
    """
    Returns non-secret configuration status for storage and email services.
    Safe to expose - no secrets included.
    """
    import os
    from storage_service import (
        STORAGE_ENABLED, STORAGE_PROVIDER, S3_BUCKET, 
        S3_ENDPOINT, PUBLIC_CDN_BASE_URL, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
    )
    from email_service import RESEND_ENABLED, RESEND_FROM, RESEND_API_KEY
    
    # Strict validation for storage
    storage_bucket_ok = bool(S3_BUCKET and S3_BUCKET != "fairystar-media" and len(S3_BUCKET) > 3)
    storage_endpoint_ok = bool(S3_ENDPOINT and "your-account-id" not in S3_ENDPOINT and S3_ENDPOINT.startswith("https://"))
    storage_access_key_ok = bool(S3_ACCESS_KEY_ID and S3_ACCESS_KEY_ID != "your_access_key_id" and len(S3_ACCESS_KEY_ID) > 10)
    storage_secret_ok = bool(S3_SECRET_ACCESS_KEY and S3_SECRET_ACCESS_KEY != "your_secret_access_key" and len(S3_SECRET_ACCESS_KEY) > 10)
    storage_cdn_ok = bool(PUBLIC_CDN_BASE_URL and "your-cdn" not in PUBLIC_CDN_BASE_URL and PUBLIC_CDN_BASE_URL.startswith("https://"))
    
    storage_fully_configured = (
        STORAGE_ENABLED and 
        storage_bucket_ok and 
        storage_endpoint_ok and 
        storage_access_key_ok and 
        storage_secret_ok and 
        storage_cdn_ok
    )
    
    # Strict validation for email
    email_api_key_ok = bool(RESEND_API_KEY and RESEND_API_KEY.startswith("re_") and len(RESEND_API_KEY) > 20)
    email_from_ok = bool(RESEND_FROM and "@" in RESEND_FROM and "fairystar.ae" not in RESEND_FROM.lower())
    
    email_fully_configured = RESEND_ENABLED and email_api_key_ok and email_from_ok
    
    # Warnings
    warnings = []
    if STORAGE_ENABLED and not storage_cdn_ok:
        warnings.append("PUBLIC_CDN_BASE_URL not set - uploads will work but public rendering may fail")
    if RESEND_ENABLED and not email_from_ok:
        warnings.append("RESEND_FROM not properly configured - emails may be rejected")
    
    return {
        "status": "ok",
        "storage": {
            "enabled": STORAGE_ENABLED,
            "provider": STORAGE_PROVIDER,
            "bucket_present": storage_bucket_ok,
            "endpoint_present": storage_endpoint_ok,
            "cdn_base_present": storage_cdn_ok,
            "credentials_present": storage_access_key_ok and storage_secret_ok,
            "configured": storage_fully_configured
        },
        "email": {
            "enabled": RESEND_ENABLED,
            "api_key_present": email_api_key_ok,
            "from_present": email_from_ok,
            "from_domain": RESEND_FROM.split("<")[-1].replace(">", "").split("@")[-1] if RESEND_FROM and "@" in RESEND_FROM else "not_set",
            "configured": email_fully_configured
        },
        "ready_for_production": {
            "storage": storage_fully_configured,
            "email": email_fully_configured
        },
        "warnings": warnings if warnings else None
    }

@api_router.post("/admin/storage/test")
async def test_storage(current_user: dict = Depends(get_current_admin)):
    """
    Test storage by uploading and deleting a tiny test file.
    Admin-only endpoint with rate limiting.
    """
    # Admin-only check
    check_admin_only(current_user, "test storage")
    
    # Rate limiting
    allowed, wait_seconds = storage_test_limiter.is_allowed(current_user["id"])
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. Try again in {wait_seconds} seconds.")
    
    if not storage_service.enabled:
        return {"status": "disabled", "message": "Storage is not enabled. Set STORAGE_ENABLED=true"}
    
    if not storage_service.is_configured():
        return {"status": "not_configured", "message": "Storage credentials not properly configured"}
    
    import asyncio
    from botocore.exceptions import ClientError
    
    test_key = f"_test/test_{uuid.uuid4().hex[:8]}.txt"
    test_content = b"Fairy Star Storage Test"
    
    try:
        # Upload test file
        await asyncio.to_thread(
            storage_service.client.put_object,
            Bucket=storage_service.bucket,
            Key=test_key,
            Body=test_content,
            ContentType="text/plain"
        )
        
        # Verify it exists
        await asyncio.to_thread(
            storage_service.client.head_object,
            Bucket=storage_service.bucket,
            Key=test_key
        )
        
        # Delete test file
        await asyncio.to_thread(
            storage_service.client.delete_object,
            Bucket=storage_service.bucket,
            Key=test_key
        )
        
        # Log success (no secrets)
        print(f"[STORAGE_TEST] Success for user {current_user['email']} - bucket: {storage_service.bucket}")
        
        return {
            "status": "success",
            "message": "Storage is working correctly",
            "details": {
                "provider": os.environ.get("STORAGE_PROVIDER", "r2"),
                "bucket": storage_service.bucket,
                "cdn_base": storage_service.cdn_base[:30] + "..." if len(storage_service.cdn_base) > 30 else storage_service.cdn_base
            }
        }
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        # Log error without secrets
        print(f"[STORAGE_TEST] Failed for user {current_user['email']} - error: {error_code}")
        return {
            "status": "error",
            "message": f"Storage test failed: {error_code}",
            "details": "Check credentials and bucket permissions"
        }
    except Exception as e:
        # Log error without secrets
        error_msg = str(e)[:100]  # Truncate to avoid leaking sensitive info
        print(f"[STORAGE_TEST] Failed for user {current_user['email']} - error: {error_msg}")
        return {
            "status": "error", 
            "message": f"Storage test failed: {error_msg}"
        }

# ---------- AUTH ROUTES ----------
@api_router.post("/auth/register")
async def register_admin(data: AdminCreate, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    existing = await db.admin_users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = AdminUser(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        role=data.role
    )
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admin_users.insert_one(doc)
    await log_audit(current_user, "create", "admin_user", user.id, {"email": data.email, "role": data.role})
    
    return {"message": "Admin created successfully", "id": user.id}

@api_router.post("/auth/login")
async def login_admin(data: AdminLogin):
    user = await db.admin_users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user.get("role", "admin"))
    return {
        "token": token, 
        "user": {
            "id": user["id"], 
            "email": user["email"], 
            "name": user["name"],
            "role": user.get("role", "admin")
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_admin)):
    return {
        "id": current_user["id"], 
        "email": current_user["email"], 
        "name": current_user["name"],
        "role": current_user.get("role", "admin")
    }

# ---------- PROPERTY ROUTES ----------
@api_router.get("/properties", response_model=List[Property])
async def get_properties(
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    guests: Optional[int] = None,
    purpose: Optional[str] = None,
    featured: Optional[bool] = None,
    status: Optional[str] = None
):
    query = {"is_active": True}
    if city:
        query["city"] = city
    if property_type:
        query["property_type"] = property_type
    if guests:
        query["max_guests"] = {"$gte": guests}
    if purpose:
        query["suitable_for"] = purpose
    if featured:
        query["is_featured"] = True
    if status:
        query["status"] = status
    if min_price is not None or max_price is not None:
        query["pricing.nightly"] = {}
        if min_price is not None:
            query["pricing.nightly"]["$gte"] = min_price
        if max_price is not None:
            query["pricing.nightly"]["$lte"] = max_price
    
    properties = await db.properties.find(query, {"_id": 0}).to_list(100)
    return properties

@api_router.get("/properties/{property_id}")
async def get_property(property_id: str):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

@api_router.post("/admin/properties")
async def create_property(data: PropertyCreate, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "properties")
    
    # Generate slug from title if not provided
    prop_data = data.model_dump()
    if not prop_data.get("slug"):
        prop_data["slug"] = data.title.lower().replace(" ", "-").replace("'", "")
    
    prop = Property(**prop_data)
    doc = prop.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    doc['pricing'] = doc['pricing']
    await db.properties.insert_one(doc)
    
    await log_audit(current_user, "create", "property", prop.id, {"title": data.title})
    
    return {"message": "Property created", "id": prop.id, "property": prop.model_dump()}

@api_router.put("/admin/properties/{property_id}")
async def update_property(property_id: str, data: PropertyUpdate, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "properties")
    
    existing = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Handle nested pricing update
    if 'pricing' in update_data and update_data['pricing']:
        update_data['pricing'] = update_data['pricing']
    
    await db.properties.update_one({"id": property_id}, {"$set": update_data})
    
    await log_audit(current_user, "update", "property", property_id, update_data)
    
    updated = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/properties/{property_id}")
async def delete_property(property_id: str, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "properties")
    
    result = await db.properties.update_one({"id": property_id}, {"$set": {"is_active": False, "status": "deleted"}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    await log_audit(current_user, "delete", "property", property_id, {})
    return {"message": "Property deleted"}

# ---------- PROPERTY MEDIA ROUTES ----------
@api_router.post("/admin/properties/{property_id}/media")
async def add_property_media(
    property_id: str,
    current_user: dict = Depends(get_current_admin),
    file: UploadFile = File(None),
    url: str = Form(None),
    type: str = Form("image"),
    video_link: str = Form(None),
    caption: str = Form(None),
    alt_text: str = Form(None),
    is_cover: bool = Form(False)
):
    check_permission(current_user, "media")
    
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    media_url = url
    
    # Handle file upload
    if file and file.filename:
        file_ext = file.filename.split(".")[-1].lower()
        file_id = str(uuid.uuid4())
        file_name = f"{property_id}_{file_id}.{file_ext}"
        file_path = MEDIA_DIR / file_name
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Return relative URL (in production, this would be a CDN URL)
        media_url = f"/api/media/{file_name}"
    
    if not media_url and not video_link:
        raise HTTPException(status_code=400, detail="Either file, url, or video_link is required")
    
    # Get current media count for ordering
    current_media = prop.get("media", [])
    order = len(current_media)
    
    # If setting as cover, unset other covers
    if is_cover:
        await db.properties.update_one(
            {"id": property_id},
            {"$set": {"media.$[].is_cover": False}}
        )
    
    media = PropertyMedia(
        url=media_url or "",
        type=type,
        video_link=video_link,
        caption=caption,
        alt_text=alt_text,
        is_cover=is_cover,
        order=order
    )
    
    await db.properties.update_one(
        {"id": property_id},
        {"$push": {"media": media.model_dump()}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Also add to images array for backward compatibility
    if type == "image" and media_url:
        await db.properties.update_one(
            {"id": property_id},
            {"$push": {"images": media_url}}
        )
    
    await log_audit(current_user, "create", "property_media", property_id, {"media_id": media.id})
    
    return {"message": "Media added", "media": media.model_dump()}

@api_router.delete("/admin/properties/{property_id}/media/{media_id}")
async def delete_property_media(property_id: str, media_id: str, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "media")
    
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Find the media to delete
    media_to_delete = None
    for m in prop.get("media", []):
        if m.get("id") == media_id:
            media_to_delete = m
            break
    
    if not media_to_delete:
        raise HTTPException(status_code=404, detail="Media not found")
    
    await db.properties.update_one(
        {"id": property_id},
        {
            "$pull": {"media": {"id": media_id}, "images": media_to_delete.get("url")},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    await log_audit(current_user, "delete", "property_media", property_id, {"media_id": media_id})
    
    return {"message": "Media deleted"}

@api_router.put("/admin/properties/{property_id}/media/reorder")
async def reorder_property_media(property_id: str, media_order: List[str], current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "media")
    
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    current_media = prop.get("media", [])
    media_dict = {m["id"]: m for m in current_media}
    
    reordered = []
    for i, media_id in enumerate(media_order):
        if media_id in media_dict:
            media_dict[media_id]["order"] = i
            reordered.append(media_dict[media_id])
    
    await db.properties.update_one(
        {"id": property_id},
        {"$set": {"media": reordered, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Media reordered"}

@api_router.put("/admin/properties/{property_id}/media/{media_id}/cover")
async def set_cover_image(property_id: str, media_id: str, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "media")
    
    # First, unset all covers
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    current_media = prop.get("media", [])
    for m in current_media:
        m["is_cover"] = m["id"] == media_id
    
    await db.properties.update_one(
        {"id": property_id},
        {"$set": {"media": current_media, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cover image set"}

# ---------- PRICING ROUTES ----------
@api_router.put("/admin/properties/{property_id}/pricing")
async def update_property_pricing(property_id: str, pricing: PropertyPricing, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "pricing")
    
    existing = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    await db.properties.update_one(
        {"id": property_id},
        {"$set": {"pricing": pricing.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await log_audit(current_user, "update", "pricing", property_id, pricing.model_dump())
    
    return {"message": "Pricing updated"}

# ---------- AVAILABILITY ROUTES ----------
@api_router.get("/admin/properties/{property_id}/availability")
async def get_property_availability(property_id: str, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "availability")
    
    blocks = await db.availability_blocks.find({"property_id": property_id}, {"_id": 0}).to_list(1000)
    return blocks

@api_router.post("/admin/properties/{property_id}/availability/blocks")
async def create_availability_block(property_id: str, data: AvailabilityBlockCreate, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "availability")
    
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check for overlapping blocks
    overlapping = await db.availability_blocks.find_one({
        "property_id": property_id,
        "$or": [
            # New block starts within existing block
            {"start_date": {"$lte": data.start_date}, "end_date": {"$gte": data.start_date}},
            # New block ends within existing block
            {"start_date": {"$lte": data.end_date}, "end_date": {"$gte": data.end_date}},
            # New block completely contains existing block
            {"start_date": {"$gte": data.start_date}, "end_date": {"$lte": data.end_date}}
        ]
    })
    
    if overlapping:
        raise HTTPException(
            status_code=400, 
            detail=f"Date range overlaps with existing block ({overlapping['start_date']} to {overlapping['end_date']}). Please unblock the existing dates first."
        )
    
    block = AvailabilityBlock(
        property_id=property_id,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
        note=data.note,
        created_by=current_user["id"]
    )
    
    doc = block.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.availability_blocks.insert_one(doc)
    
    await log_audit(current_user, "create", "availability_block", block.id, {"property_id": property_id, "dates": f"{data.start_date} - {data.end_date}"})
    
    return {"message": "Block created", "block": block.model_dump()}

@api_router.delete("/admin/properties/{property_id}/availability/blocks/{block_id}")
async def delete_availability_block(property_id: str, block_id: str, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "availability")
    
    result = await db.availability_blocks.delete_one({"id": block_id, "property_id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Block not found")
    
    await log_audit(current_user, "delete", "availability_block", block_id, {})
    
    return {"message": "Block deleted"}

# ---------- COORDINATOR ROUTES ----------
@api_router.get("/admin/coordinators")
async def get_coordinators(current_user: dict = Depends(get_current_admin)):
    coordinators = await db.coordinators.find({"is_active": True}, {"_id": 0}).to_list(100)
    return coordinators

@api_router.post("/admin/coordinators")
async def create_coordinator(data: CoordinatorCreate, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    
    coordinator = Coordinator(**data.model_dump())
    doc = coordinator.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.coordinators.insert_one(doc)
    
    return {"message": "Coordinator created", "coordinator": coordinator.model_dump()}

@api_router.delete("/admin/coordinators/{coordinator_id}")
async def delete_coordinator(coordinator_id: str, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    
    await db.coordinators.update_one({"id": coordinator_id}, {"$set": {"is_active": False}})
    return {"message": "Coordinator deleted"}

# ---------- ADD-ON SERVICES ROUTES ----------
@api_router.get("/services")
async def get_services(category: Optional[str] = None):
    query = {"is_active": True}
    if category:
        query["category"] = category
    services = await db.services.find(query, {"_id": 0}).to_list(100)
    return services

@api_router.post("/admin/services")
async def create_service(data: dict, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    service = AddOnService(**data)
    await db.services.insert_one(service.model_dump())
    return service.model_dump()

@api_router.put("/admin/services/{service_id}")
async def update_service(service_id: str, data: dict, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    await db.services.update_one({"id": service_id}, {"$set": data})
    return {"message": "Service updated"}

@api_router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    await db.services.update_one({"id": service_id}, {"$set": {"is_active": False}})
    return {"message": "Service deleted"}

# ---------- SERVICE REQUESTS ROUTES ----------
@api_router.get("/admin/service-requests")
async def get_service_requests(
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    query = {}
    if status:
        query["status"] = status
    if service_type:
        query["service_type"] = service_type
    requests = await db.service_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return requests

@api_router.post("/admin/service-requests")
async def create_service_request(data: ServiceRequestCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_admin)):
    request = ServiceRequest(**data.model_dump())
    doc = request.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.service_requests.insert_one(doc)
    
    # Send service request alert in background
    background_tasks.add_task(email_service.send_service_request_alert, request.id)
    
    return {"message": "Service request created", "request": request.model_dump()}

@api_router.put("/admin/service-requests/{request_id}")
async def update_service_request(request_id: str, data: dict, current_user: dict = Depends(get_current_admin)):
    data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.service_requests.update_one({"id": request_id}, {"$set": data})
    return {"message": "Service request updated"}

# ---------- LEAD ROUTES ----------
@api_router.post("/leads")
async def create_lead(data: LeadCreate, background_tasks: BackgroundTasks):
    lead = Lead(**data.model_dump())
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.leads.insert_one(doc)
    logger.info(f"New lead created: {lead.id} - {lead.email}")
    
    # Send new lead alert email in background
    background_tasks.add_task(email_service.send_new_lead_alert, lead.id)
    
    # Fire CRM webhook in background
    background_tasks.add_task(fire_crm_webhook, doc)
    
    return lead.model_dump()

@api_router.get("/admin/leads")
async def get_leads(
    status: Optional[str] = None,
    lead_type: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    query = {}
    if status:
        query["status"] = status
    if lead_type:
        query["lead_type"] = lead_type
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return leads

@api_router.get("/admin/leads/{lead_id}")
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_admin)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@api_router.put("/admin/leads/{lead_id}")
async def update_lead(lead_id: str, data: LeadUpdate, current_user: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    await log_audit(current_user, "update", "lead", lead_id, update_data)
    
    updated = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return updated

@api_router.put("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, status: str, current_user: dict = Depends(get_current_admin)):
    result = await db.leads.update_one({"id": lead_id}, {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    await log_audit(current_user, "update", "lead", lead_id, {"status": status})
    return {"message": "Lead status updated"}

# ---------- BOOKING ROUTES ----------
@api_router.post("/bookings/calculate")
async def calculate_booking(
    property_id: str,
    check_in: str,
    check_out: str,
    guests: int,
    add_on_ids: List[str] = []
):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    from datetime import datetime as dt
    check_in_date = dt.strptime(check_in, "%Y-%m-%d")
    check_out_date = dt.strptime(check_out, "%Y-%m-%d")
    nights = (check_out_date - check_in_date).days
    
    if nights <= 0:
        raise HTTPException(status_code=400, detail="Invalid date range")
    
    pricing = prop.get("pricing", {})
    nightly_rate = pricing.get("nightly", 0)
    base_price = nightly_rate * nights
    cleaning_fee = pricing.get("cleaning_fee", 0)
    service_fee = base_price * (pricing.get("service_fee_percent", 10) / 100)
    taxes = base_price * (pricing.get("taxes_percent", 5) / 100)
    
    # Apply discounts
    if nights >= 7 and pricing.get("weekly_discount", 0) > 0:
        base_price = base_price * (1 - pricing["weekly_discount"] / 100)
    elif nights >= 30 and pricing.get("monthly_discount", 0) > 0:
        base_price = base_price * (1 - pricing["monthly_discount"] / 100)
    
    # Calculate add-ons
    add_ons_total = 0.0
    add_ons_details = []
    if add_on_ids:
        services = await db.services.find({"id": {"$in": add_on_ids}}, {"_id": 0}).to_list(100)
        for svc in services:
            price = svc["price"]
            if svc["price_type"] == "per_day":
                price = price * nights
            elif svc["price_type"] == "per_person":
                price = price * guests
            add_ons_total += price
            add_ons_details.append({"id": svc["id"], "name": svc["name"], "price": price})
    
    total = base_price + cleaning_fee + service_fee + taxes + add_ons_total
    deposit = total * 0.3
    
    return {
        "nights": nights,
        "base_price": round(base_price, 2),
        "cleaning_fee": round(cleaning_fee, 2),
        "service_fee": round(service_fee, 2),
        "taxes": round(taxes, 2),
        "add_ons": add_ons_details,
        "add_ons_total": round(add_ons_total, 2),
        "total": round(total, 2),
        "deposit": round(deposit, 2)
    }

@api_router.post("/bookings")
async def create_booking(data: BookingCreate, request: Request):
    prop = await db.properties.find_one({"id": data.property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    from datetime import datetime as dt
    check_in_date = dt.strptime(data.check_in, "%Y-%m-%d")
    check_out_date = dt.strptime(data.check_out, "%Y-%m-%d")
    nights = (check_out_date - check_in_date).days
    
    pricing = prop.get("pricing", {})
    nightly_rate = pricing.get("nightly", 0)
    base_price = nightly_rate * nights
    cleaning_fee = pricing.get("cleaning_fee", 0)
    service_fee = base_price * (pricing.get("service_fee_percent", 10) / 100)
    taxes = base_price * (pricing.get("taxes_percent", 5) / 100)
    
    add_ons_total = sum(a.price * a.quantity for a in data.add_ons)
    total = base_price + cleaning_fee + service_fee + taxes + add_ons_total
    deposit = total * 0.3
    
    booking = Booking(
        property_id=data.property_id,
        property_title=prop["title"],
        guest_name=data.guest_name,
        guest_email=data.guest_email,
        guest_phone=data.guest_phone,
        check_in=data.check_in,
        check_out=data.check_out,
        guests=data.guests,
        nights=nights,
        base_price=round(base_price, 2),
        cleaning_fee=round(cleaning_fee, 2),
        service_fee=round(service_fee, 2),
        taxes=round(taxes, 2),
        add_ons=[a.model_dump() for a in data.add_ons],
        add_ons_total=round(add_ons_total, 2),
        total_amount=round(total, 2),
        deposit_amount=round(deposit, 2),
        payment_type=data.payment_type,
        special_requests=data.special_requests
    )
    
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.bookings.insert_one(doc)
    
    return {"booking_id": booking.id, "total": booking.total_amount, "deposit": booking.deposit_amount}

@api_router.get("/admin/bookings")
async def get_admin_bookings(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    property_id: Optional[str] = None,
    coordinator_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    query = {}
    if status:
        query["booking_status"] = status
    if payment_status:
        query["payment_status"] = payment_status
    if property_id:
        query["property_id"] = property_id
    if coordinator_id:
        query["coordinator_id"] = coordinator_id
    if date_from:
        query["check_in"] = {"$gte": date_from}
    if date_to:
        query.setdefault("check_in", {})["$lte"] = date_to
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return bookings

@api_router.get("/admin/bookings/{booking_id}")
async def get_admin_booking(booking_id: str, current_user: dict = Depends(get_current_admin)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@api_router.put("/admin/bookings/{booking_id}")
async def update_booking(booking_id: str, data: BookingUpdate, current_user: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # If assigning coordinator, get coordinator name
    if data.coordinator_id:
        coordinator = await db.coordinators.find_one({"id": data.coordinator_id}, {"_id": 0})
        if coordinator:
            update_data["coordinator_name"] = coordinator["name"]
    
    result = await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await log_audit(current_user, "update", "booking", booking_id, update_data)
    
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated

@api_router.put("/admin/bookings/{booking_id}/assign-coordinator")
async def assign_coordinator(booking_id: str, coordinator_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_admin)):
    coordinator = await db.coordinators.find_one({"id": coordinator_id}, {"_id": 0})
    if not coordinator:
        raise HTTPException(status_code=404, detail="Coordinator not found")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "coordinator_id": coordinator_id,
            "coordinator_name": coordinator["name"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Increment coordinator's assigned bookings count
    await db.coordinators.update_one({"id": coordinator_id}, {"$inc": {"assigned_bookings": 1}})
    
    await log_audit(current_user, "update", "booking", booking_id, {"coordinator_id": coordinator_id})
    
    # Send coordinator assigned email to guest in background
    background_tasks.add_task(email_service.send_coordinator_assigned, booking_id)
    
    return {"message": "Coordinator assigned"}

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

# Backward compatibility - old bookings endpoint
@api_router.get("/bookings")
async def get_bookings(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    query = {}
    if status:
        query["booking_status"] = status
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return bookings

# ---------- PAYMENT ROUTES ----------
@api_router.post("/payments/create-checkout")
async def create_checkout_session(booking_id: str, origin_url: str, request: Request):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    amount = booking["deposit_amount"] if booking["payment_type"] == "deposit" else booking["total_amount"]
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/booking/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency="aed",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": booking_id,
            "guest_email": booking["guest_email"],
            "payment_type": booking["payment_type"]
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    transaction = PaymentTransaction(
        booking_id=booking_id,
        session_id=session.session_id,
        amount=float(amount),
        currency="aed",
        payment_status="initiated",
        metadata={"booking_id": booking_id, "guest_email": booking["guest_email"]}
    )
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    trans_doc['updated_at'] = trans_doc['updated_at'].isoformat()
    await db.payment_transactions.insert_one(trans_doc)
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"stripe_session_id": session.session_id}}
    )
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    booking = await db.bookings.find_one({"stripe_session_id": session_id}, {"_id": 0})
    
    if status.payment_status == "paid":
        trans = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if trans and trans["payment_status"] != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            await db.bookings.update_one(
                {"stripe_session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "booking_status": "confirmed",
                    "payment_confirmed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            booking = await db.bookings.find_one({"stripe_session_id": session_id}, {"_id": 0})
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total,
        "currency": status.currency,
        "booking": booking
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            
            existing_booking = await db.bookings.find_one(
                {"stripe_session_id": session_id},
                {"_id": 0, "payment_status": 1, "id": 1}
            )
            
            if existing_booking and existing_booking.get("payment_status") == "paid":
                logger.info(f"Webhook: Booking {existing_booking.get('id')} already paid, skipping duplicate")
                return {"status": "already_processed"}
            
            existing_trans = await db.payment_transactions.find_one(
                {"session_id": session_id},
                {"_id": 0, "payment_status": 1}
            )
            
            if existing_trans and existing_trans.get("payment_status") == "paid":
                logger.info(f"Webhook: Transaction for session {session_id} already paid, skipping duplicate")
                return {"status": "already_processed"}
            
            update_result = await db.bookings.update_one(
                {"stripe_session_id": session_id, "payment_status": {"$ne": "paid"}},
                {"$set": {
                    "payment_status": "paid",
                    "booking_status": "confirmed",
                    "payment_confirmed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            if update_result.modified_count > 0:
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"Webhook: Successfully confirmed booking for session {session_id}")
                
                # SEND EMAILS: Booking confirmation to guest + New booking alert to admin
                # Get the booking ID for email sending
                updated_booking = await db.bookings.find_one({"stripe_session_id": session_id}, {"_id": 0, "id": 1})
                if updated_booking:
                    booking_id = updated_booking["id"]
                    # Send emails in background (idempotent - won't duplicate)
                    background_tasks.add_task(email_service.send_booking_confirmation, booking_id)
                    background_tasks.add_task(email_service.send_new_booking_alert, booking_id)
                    logger.info(f"Webhook: Queued confirmation emails for booking {booking_id}")
            else:
                logger.info(f"Webhook: No booking updated for session {session_id} (likely already processed)")
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ---------- ADMIN DASHBOARD STATS ----------
@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_admin)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    total_properties = await db.properties.count_documents({"is_active": True})
    total_bookings = await db.bookings.count_documents({})
    confirmed_bookings = await db.bookings.count_documents({"booking_status": "confirmed"})
    pending_bookings = await db.bookings.count_documents({"booking_status": "pending"})
    total_leads = await db.leads.count_documents({})
    new_leads = await db.leads.count_documents({"status": "new"})
    
    # Bookings needing coordinator
    unassigned_bookings = await db.bookings.count_documents({
        "booking_status": "confirmed",
        "coordinator_id": None
    })
    
    # Upcoming check-ins (next 7 days)
    from datetime import timedelta as td
    next_week = (datetime.now(timezone.utc) + td(days=7)).strftime("%Y-%m-%d")
    upcoming_checkins = await db.bookings.count_documents({
        "check_in": {"$gte": today, "$lte": next_week},
        "booking_status": "confirmed"
    })
    
    # Revenue calculation
    paid_bookings = await db.bookings.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    total_revenue = sum(b.get("total_amount", 0) for b in paid_bookings)
    
    return {
        "total_properties": total_properties,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "pending_bookings": pending_bookings,
        "total_leads": total_leads,
        "new_leads": new_leads,
        "total_revenue": round(total_revenue, 2),
        "unassigned_bookings": unassigned_bookings,
        "upcoming_checkins": upcoming_checkins
    }

# ---------- AUDIT LOG ROUTES ----------
@api_router.get("/admin/audit-logs")
async def get_audit_logs(
    entity_type: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_admin)
):
    check_permission(current_user, "all")
    
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if user_id:
        query["user_id"] = user_id
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs

# ---------- ADMIN USERS ROUTES ----------
@api_router.get("/admin/users")
async def get_admin_users(current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    users = await db.admin_users.find({"is_active": True}, {"_id": 0, "password_hash": 0}).to_list(100)
    return users

# ---------- EMAIL SETTINGS ROUTES ----------
class EmailSettings(BaseModel):
    enabled: bool = False
    admin_email: str = "admin@fairystar.ae"
    booking_confirmation_enabled: bool = True
    new_booking_alert_enabled: bool = True
    coordinator_assigned_enabled: bool = True
    lead_alert_enabled: bool = True
    service_alert_enabled: bool = True

@api_router.get("/admin/email/settings")
async def get_email_settings(current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    settings = await db.email_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "default",
            "enabled": os.environ.get("RESEND_ENABLED", "false").lower() == "true",
            "admin_email": "admin@fairystar.ae",
            "booking_confirmation_enabled": True,
            "new_booking_alert_enabled": True,
            "coordinator_assigned_enabled": True,
            "lead_alert_enabled": True,
            "service_alert_enabled": True,
            "resend_configured": bool(os.environ.get("RESEND_API_KEY")) and os.environ.get("RESEND_API_KEY") != "re_placeholder_add_your_key_here",
            "resend_from": os.environ.get("RESEND_FROM", ""),
            "test_mode": bool(os.environ.get("RESEND_TEST_RECIPIENTS", "").strip())
        }
    else:
        settings["resend_configured"] = bool(os.environ.get("RESEND_API_KEY")) and os.environ.get("RESEND_API_KEY") != "re_placeholder_add_your_key_here"
        settings["resend_from"] = os.environ.get("RESEND_FROM", "")
        settings["test_mode"] = bool(os.environ.get("RESEND_TEST_RECIPIENTS", "").strip())
    return settings

@api_router.put("/admin/email/settings")
async def update_email_settings(settings: EmailSettings, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    data = settings.model_dump()
    data["id"] = "default"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.email_settings.update_one({"id": "default"}, {"$set": data}, upsert=True)
    await log_audit(current_user, "update", "email_settings", "default", data)
    return {"message": "Email settings updated"}

@api_router.post("/admin/email/test")
async def send_test_email(email_type: str, test_email: str, current_user: dict = Depends(get_current_admin)):
    """Send a test email to verify configuration. Admin-only with rate limiting."""
    # Admin-only check
    check_admin_only(current_user, "send test emails")
    
    # Rate limiting
    allowed, wait_seconds = email_test_limiter.is_allowed(current_user["id"])
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. Try again in {wait_seconds} seconds.")
    
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key or api_key == "re_placeholder_add_your_key_here" or not api_key.startswith("re_"):
        return {"status": "not_configured", "message": "Resend API key not configured. Add RESEND_API_KEY to .env"}
    
    import resend
    resend.api_key = api_key
    
    try:
        # Create a simple test email
        html = f"""
        <div style="font-family: Arial; padding: 20px; background: #333D47; color: white;">
            <h1 style="color: #F3A15A;">Fairy Star Email Test</h1>
            <p>This is a test email from Fairy Star Vacation Homes.</p>
            <p>Email type: <strong>{email_type}</strong></p>
            <p>Sent at: {datetime.now(timezone.utc).isoformat()}</p>
            <p>If you received this, your email configuration is working!</p>
        </div>
        """
        
        import asyncio
        result = await asyncio.to_thread(resend.Emails.send, {
            "from": os.environ.get("RESEND_FROM", "Fairy Star <noreply@fairystar.ae>"),
            "to": [test_email],
            "subject": f"[TEST] Fairy Star Email Configuration - {email_type}",
            "html": html
        })
        
        # Log without secrets
        print(f"[EMAIL_TEST] Success for user {current_user['email']} - sent to {test_email[:20]}...")
        return {"status": "sent", "email_id": result.get("id"), "recipient": test_email}
    except Exception as e:
        error_msg = str(e)[:100]  # Truncate to avoid leaking sensitive info
        print(f"[EMAIL_TEST] Failed for user {current_user['email']} - error: {error_msg}")
        return {"status": "error", "message": error_msg}

@api_router.get("/admin/email/status/{entity_type}/{entity_id}")
async def get_email_status(entity_type: str, entity_id: str, current_user: dict = Depends(get_current_admin)):
    """Get email sending status for a specific entity (booking, lead, service_request)"""
    collection_map = {
        "booking": "bookings",
        "lead": "leads",
        "service_request": "service_requests"
    }
    
    collection = collection_map.get(entity_type)
    if not collection:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    doc = await db[collection].find_one({"id": entity_id}, {"_id": 0, "emails": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    return {"entity_id": entity_id, "entity_type": entity_type, "emails": doc.get("emails", {})}

@api_router.post("/admin/email/resend/{email_type}/{entity_id}")
async def resend_email(email_type: str, entity_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_admin)):
    """Manually resend a specific email (resets the sent flag first)"""
    check_permission(current_user, "all")
    
    email_type_map = {
        "booking_confirmation": ("bookings", email_service.send_booking_confirmation),
        "new_booking_alert": ("bookings", email_service.send_new_booking_alert),
        "coordinator_assigned": ("bookings", email_service.send_coordinator_assigned),
        "lead_alert": ("leads", email_service.send_new_lead_alert),
        "service_alert": ("service_requests", email_service.send_service_request_alert)
    }
    
    if email_type not in email_type_map:
        raise HTTPException(status_code=400, detail="Invalid email type")
    
    collection, send_func = email_type_map[email_type]
    
    # Reset the email sent flag to allow resending
    await db[collection].update_one(
        {"id": entity_id},
        {"$unset": {f"emails.{email_type}": ""}}
    )
    
    # Queue the email
    background_tasks.add_task(send_func, entity_id)
    await log_audit(current_user, "resend_email", email_type, entity_id, {})
    
    return {"status": "queued", "email_type": email_type, "entity_id": entity_id}

# ---------- CLOUD STORAGE ROUTES ----------

# ---------- CRM WEBHOOK ROUTES ----------
class CRMWebhookSettings(BaseModel):
    webhook_url: str = ""
    enabled: bool = False
    include_fields: List[str] = ["name", "email", "phone", "lead_type", "city", "message", "source", "created_at"]

@api_router.get("/admin/crm/settings")
async def get_crm_settings(current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    settings = await db.crm_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        settings = {"id": "default", "webhook_url": "", "enabled": False, "include_fields": ["name", "email", "phone", "lead_type", "city", "message", "source", "created_at"], "last_test": None, "last_test_status": None}
    return settings

@api_router.put("/admin/crm/settings")
async def update_crm_settings(settings: CRMWebhookSettings, current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    data = settings.model_dump()
    data["id"] = "default"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.crm_settings.update_one({"id": "default"}, {"$set": data}, upsert=True)
    await log_audit(current_user, "update", "crm_settings", "default", {"webhook_url": data["webhook_url"], "enabled": data["enabled"]})
    return {"message": "CRM settings updated"}

@api_router.post("/admin/crm/test")
async def test_crm_webhook(current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    settings = await db.crm_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings or not settings.get("webhook_url"):
        return {"status": "error", "message": "No webhook URL configured"}
    
    test_payload = {
        "event": "test",
        "source": "fairy_star_crm",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "name": "Test Lead",
            "email": "test@example.com",
            "phone": "+971500000000",
            "lead_type": "general",
            "message": "This is a test webhook from Fairy Star Vacation Homes"
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(settings["webhook_url"], json=test_payload)
            status = "success" if resp.status_code < 400 else "error"
            msg = f"Webhook responded with status {resp.status_code}" 
    except Exception as e:
        status = "error"
        msg = str(e)
    
    await db.crm_settings.update_one({"id": "default"}, {"$set": {"last_test": datetime.now(timezone.utc).isoformat(), "last_test_status": status}})
    return {"status": status, "message": msg}

async def fire_crm_webhook(lead_data: dict):
    """Fire CRM webhook in background for new leads."""
    try:
        settings = await db.crm_settings.find_one({"id": "default"}, {"_id": 0})
        if not settings or not settings.get("enabled") or not settings.get("webhook_url"):
            return
        
        include = settings.get("include_fields", [])
        filtered = {k: v for k, v in lead_data.items() if k in include} if include else lead_data
        
        payload = {
            "event": "new_lead",
            "source": "fairy_star_crm",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": filtered
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(settings["webhook_url"], json=payload)
    except Exception as e:
        logger.error(f"CRM webhook error: {e}")

# ---------- CLOUD STORAGE ROUTES (continued) ----------
class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str
    size_bytes: int

class ConfirmUploadRequest(BaseModel):
    storage_key: str
    public_url: str
    media_type: str
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    is_cover: bool = False

class VideoLinkRequest(BaseModel):
    video_link: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None

class MediaMetadataUpdate(BaseModel):
    caption: Optional[str] = None
    alt_text: Optional[str] = None

@api_router.get("/admin/storage/settings")
async def get_storage_settings(current_user: dict = Depends(get_current_admin)):
    """Get storage configuration status"""
    check_permission(current_user, "all")
    return storage_service.get_config_status()

@api_router.post("/admin/properties/{property_id}/media/presign")
async def get_presigned_upload_url(
    property_id: str,
    data: PresignedUrlRequest,
    current_user: dict = Depends(get_current_admin)
):
    """Generate pre-signed URL for direct upload to S3/R2"""
    check_permission(current_user, "media")
    
    # Verify property exists
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0, "id": 1})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    result = await storage_service.generate_presigned_upload_url(
        property_id=property_id,
        filename=data.filename,
        content_type=data.content_type,
        size_bytes=data.size_bytes
    )
    
    if result.get("status") == "error" or result.get("status") == "validation_error":
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    if result.get("status") in ["disabled", "not_configured"]:
        return result
    
    return result

@api_router.post("/admin/properties/{property_id}/media/confirm")
async def confirm_media_upload(
    property_id: str,
    data: ConfirmUploadRequest,
    current_user: dict = Depends(get_current_admin)
):
    """Confirm upload and store metadata"""
    check_permission(current_user, "media")
    
    result = await storage_service.confirm_upload(
        property_id=property_id,
        storage_key=data.storage_key,
        public_url=data.public_url,
        media_type=data.media_type,
        caption=data.caption,
        alt_text=data.alt_text,
        is_cover=data.is_cover
    )
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    await log_audit(current_user, "create", "property_media", property_id, {"storage_key": data.storage_key})
    
    return result

@api_router.post("/admin/properties/{property_id}/media/video-link")
async def add_video_link(
    property_id: str,
    data: VideoLinkRequest,
    current_user: dict = Depends(get_current_admin)
):
    """Add a video via external link (YouTube/Vimeo)"""
    check_permission(current_user, "media")
    
    result = await storage_service.add_video_link(
        property_id=property_id,
        video_link=data.video_link,
        thumbnail_url=data.thumbnail_url,
        caption=data.caption
    )
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    await log_audit(current_user, "create", "property_media", property_id, {"video_link": data.video_link})
    
    return result

@api_router.delete("/admin/properties/{property_id}/media/cloud/{media_id}")
async def delete_cloud_media(
    property_id: str,
    media_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete media from cloud storage and database"""
    check_permission(current_user, "media")
    
    result = await storage_service.delete_media(property_id, media_id)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    await log_audit(current_user, "delete", "property_media", property_id, {"media_id": media_id})
    
    return result

@api_router.put("/admin/properties/{property_id}/media/reorder")
async def reorder_media(
    property_id: str,
    media_order: List[str],
    current_user: dict = Depends(get_current_admin)
):
    """Reorder media gallery"""
    check_permission(current_user, "media")
    
    result = await storage_service.reorder_media(property_id, media_order)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    await log_audit(current_user, "update", "property_media_order", property_id, {"order": media_order})
    
    return result

@api_router.put("/admin/properties/{property_id}/media/{media_id}/cover")
async def set_media_cover(
    property_id: str,
    media_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Set a media item as the cover image"""
    check_permission(current_user, "media")
    
    result = await storage_service.set_cover_image(property_id, media_id)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    await log_audit(current_user, "update", "property_cover", property_id, {"media_id": media_id})
    
    return result

@api_router.put("/admin/properties/{property_id}/media/{media_id}/metadata")
async def update_media_metadata(
    property_id: str,
    media_id: str,
    data: MediaMetadataUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Update media caption and alt text"""
    check_permission(current_user, "media")
    
    result = await storage_service.update_media_metadata(
        property_id, media_id, data.caption, data.alt_text
    )
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@api_router.get("/admin/properties/{property_id}/media")
async def get_property_media(
    property_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Get all media for a property"""
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0, "media": 1, "images": 1})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {
        "media": prop.get("media", []),
        "images": prop.get("images", []),
        "storage_configured": storage_service.is_configured()
    }

# ---------- MEDIA SERVING ----------
@api_router.get("/media/{filename}")
async def serve_media(filename: str):
    file_path = MEDIA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    from starlette.responses import FileResponse
    return FileResponse(file_path)

# ---------- SEED DATA ----------
@api_router.post("/seed")
async def seed_data():
    existing = await db.properties.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}
    
    properties = [
        {
            "id": str(uuid.uuid4()),
            "title": "Luxury Marina View Apartment",
            "slug": "luxury-marina-view-apartment",
            "description": "Stunning 2-bedroom apartment with panoramic views of Dubai Marina. Modern furnishings, fully equipped kitchen, and access to premium amenities including infinity pool and gym.",
            "full_description": "Experience luxury living in this stunning 2-bedroom apartment located in the heart of Dubai Marina. Wake up to breathtaking panoramic views of the marina and cityscape. The apartment features modern furnishings, a fully equipped kitchen with premium appliances, and spacious living areas perfect for relaxation or entertaining. Residents have access to world-class amenities including an infinity pool, state-of-the-art gym, and 24/7 concierge service.",
            "property_type": "holiday_home",
            "city": "Dubai",
            "area": "Dubai Marina",
            "address": "Dubai Marina, Marina Walk Tower 3",
            "bedrooms": 2,
            "beds": 3,
            "bathrooms": 2,
            "max_guests": 4,
            "images": [
                "https://images.unsplash.com/photo-1638454795595-0a0abf68614d?w=800",
                "https://images.unsplash.com/photo-1769504574886-8fc9e4e554e8?w=800",
                "https://images.unsplash.com/photo-1757439402296-000be181e38b?w=800"
            ],
            "media": [],
            "amenities": ["WiFi", "Pool", "Gym", "Parking", "Kitchen", "Washer", "Air Conditioning", "Sea View"],
            "house_rules": "No smoking. No parties. Quiet hours after 10 PM.",
            "check_in_time": "15:00",
            "check_out_time": "11:00",
            "pricing": {
                "nightly": 450.0, 
                "monthly": 9000.0, 
                "cleaning_fee": 100.0, 
                "service_fee_percent": 10.0,
                "taxes_percent": 5.0,
                "security_deposit": 500.0,
                "weekly_discount": 10.0,
                "monthly_discount": 20.0,
                "minimum_nights": 2,
                "maximum_nights": 90
            },
            "badges": ["Verified", "Managed", "Premium"],
            "is_featured": True,
            "is_active": True,
            "status": "published",
            "suitable_for": ["leisure", "corporate", "long_stay"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Downtown Business Suite",
            "slug": "downtown-business-suite",
            "description": "Executive 1-bedroom suite in the heart of Downtown Dubai. Walking distance to Dubai Mall and Burj Khalifa. Perfect for business travelers.",
            "property_type": "hotel_apartment",
            "city": "Dubai",
            "area": "Downtown Dubai",
            "address": "Downtown Dubai, Boulevard Point",
            "bedrooms": 1,
            "beds": 1,
            "bathrooms": 1,
            "max_guests": 2,
            "images": [
                "https://images.unsplash.com/photo-1769504574886-8fc9e4e554e8?w=800",
                "https://images.unsplash.com/photo-1638454795595-0a0abf68614d?w=800"
            ],
            "media": [],
            "amenities": ["WiFi", "Gym", "Concierge", "Room Service", "Business Center"],
            "check_in_time": "14:00",
            "check_out_time": "12:00",
            "pricing": {
                "nightly": 350.0, 
                "monthly": 7500.0, 
                "cleaning_fee": 75.0, 
                "service_fee_percent": 10.0,
                "taxes_percent": 5.0,
                "minimum_nights": 1,
                "maximum_nights": 365
            },
            "badges": ["Verified", "Business Hub", "Premium"],
            "is_featured": True,
            "is_active": True,
            "status": "published",
            "suitable_for": ["corporate", "business"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Beachfront Villa with Private Pool",
            "slug": "beachfront-villa-private-pool",
            "description": "Luxurious 4-bedroom villa on Palm Jumeirah with private beach access and pool. Ideal for families seeking a premium vacation experience.",
            "property_type": "villa_resort",
            "city": "Dubai",
            "area": "Palm Jumeirah",
            "address": "Palm Jumeirah, Frond M",
            "bedrooms": 4,
            "beds": 5,
            "bathrooms": 4,
            "max_guests": 8,
            "images": [
                "https://images.unsplash.com/photo-1757439402296-000be181e38b?w=800",
                "https://images.unsplash.com/photo-1757439402375-2f2a4ab0dc75?w=800",
                "https://images.unsplash.com/photo-1757439402268-1da284675170?w=800"
            ],
            "media": [],
            "amenities": ["Private Pool", "Beach Access", "WiFi", "BBQ", "Garden", "Parking", "Maid Service"],
            "check_in_time": "15:00",
            "check_out_time": "11:00",
            "pricing": {
                "nightly": 1500.0, 
                "monthly": 35000.0, 
                "cleaning_fee": 200.0, 
                "service_fee_percent": 10.0,
                "taxes_percent": 5.0,
                "security_deposit": 2000.0,
                "minimum_nights": 3,
                "maximum_nights": 60
            },
            "badges": ["Verified", "Managed", "Family-friendly", "Premium"],
            "is_featured": True,
            "is_active": True,
            "status": "published",
            "suitable_for": ["leisure", "family", "long_stay"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Add more properties
    more_properties = [
        {"title": "Recovery-Friendly Studio Near Healthcare City", "city": "Dubai", "area": "Healthcare City", "type": "hotel_apartment", "beds": 1, "baths": 1, "guests": 2, "price": 250, "badges": ["Verified", "Recovery-friendly", "Medical Travel"], "suitable": ["medical", "long_stay"]},
        {"title": "Sharjah Waterfront Apartment", "city": "Sharjah", "area": "Al Majaz", "type": "holiday_home", "beds": 2, "baths": 2, "guests": 5, "price": 200, "badges": ["Verified", "Managed", "Family-friendly"], "suitable": ["leisure", "family", "long_stay"]},
        {"title": "RAK Mountain View Retreat", "city": "Ras Al Khaimah", "area": "Al Hamra", "type": "villa_resort", "beds": 3, "baths": 3, "guests": 6, "price": 600, "badges": ["Verified", "Managed", "Nature Retreat"], "suitable": ["leisure", "family", "wellness"]},
        {"title": "JBR Beachfront Studio", "city": "Dubai", "area": "JBR", "type": "hotel_apartment", "beds": 0, "baths": 1, "guests": 2, "price": 280, "badges": ["Verified", "Beach Access", "Couples"], "suitable": ["leisure", "couples"]},
        {"title": "Business Bay Executive Apartment", "city": "Dubai", "area": "Business Bay", "type": "hotel_apartment", "beds": 1, "baths": 1, "guests": 3, "price": 320, "badges": ["Verified", "Business Hub", "Corporate"], "suitable": ["corporate", "business", "long_stay"]},
        {"title": "Dubai Silicon Oasis Family Home", "city": "Dubai", "area": "Dubai Silicon Oasis", "type": "holiday_home", "beds": 3, "baths": 3, "guests": 6, "price": 380, "badges": ["Verified", "Family-friendly", "Long Stay"], "suitable": ["family", "long_stay", "corporate"]},
        {"title": "Sharjah City Center Apartment", "city": "Sharjah", "area": "Al Majaz 3", "type": "holiday_home", "beds": 2, "baths": 1, "guests": 4, "price": 150, "badges": ["Verified", "Budget-friendly", "Family-friendly"], "suitable": ["leisure", "family", "long_stay"]},
        {"title": "RAK Beach Resort Villa", "city": "Ras Al Khaimah", "area": "Al Hamra Village", "type": "villa_resort", "beds": 5, "baths": 5, "guests": 10, "price": 2000, "badges": ["Verified", "Premium", "Beach Access", "Family-friendly"], "suitable": ["leisure", "family", "groups"]},
        {"title": "DIFC Luxury Penthouse", "city": "Dubai", "area": "DIFC", "type": "hotel_apartment", "beds": 3, "baths": 3, "guests": 6, "price": 1800, "badges": ["Premium", "Luxury", "Concierge"], "suitable": ["corporate", "luxury", "business"]},
        {"title": "Al Barsha Family Villa", "city": "Dubai", "area": "Al Barsha", "type": "villa_resort", "beds": 4, "baths": 4, "guests": 8, "price": 900, "badges": ["Verified", "Family-friendly", "Near Mall"], "suitable": ["family", "leisure"]},
        {"title": "Jumeirah Lake Towers Studio", "city": "Dubai", "area": "JLT", "type": "hotel_apartment", "beds": 0, "baths": 1, "guests": 2, "price": 180, "badges": ["Verified", "Budget-friendly"], "suitable": ["corporate", "solo"]},
        {"title": "Sports City Apartment", "city": "Dubai", "area": "Dubai Sports City", "type": "holiday_home", "beds": 2, "baths": 2, "guests": 4, "price": 220, "badges": ["Verified", "Sports Facilities"], "suitable": ["sports", "leisure"]},
        {"title": "Creek Harbour Premium Suite", "city": "Dubai", "area": "Dubai Creek Harbour", "type": "hotel_apartment", "beds": 2, "baths": 2, "guests": 4, "price": 550, "badges": ["Premium", "Creek View", "New Development"], "suitable": ["leisure", "corporate"]},
        {"title": "Ajman Corniche Retreat", "city": "Ajman", "area": "Corniche", "type": "holiday_home", "beds": 3, "baths": 2, "guests": 6, "price": 300, "badges": ["Verified", "Sea View", "Budget-friendly"], "suitable": ["family", "leisure"]}
    ]
    
    for mp in more_properties:
        properties.append({
            "id": str(uuid.uuid4()),
            "title": mp["title"],
            "slug": mp["title"].lower().replace(" ", "-"),
            "description": f"Beautiful {mp['beds'] or 'studio'} bedroom property in {mp['area']}, {mp['city']}. Perfect for travelers looking for comfort and convenience.",
            "property_type": mp["type"],
            "city": mp["city"],
            "area": mp["area"],
            "address": f"{mp['area']}, {mp['city']}",
            "bedrooms": mp["beds"],
            "beds": mp["beds"] or 1,
            "bathrooms": mp["baths"],
            "max_guests": mp["guests"],
            "images": ["https://images.unsplash.com/photo-1638454795595-0a0abf68614d?w=800"],
            "media": [],
            "amenities": ["WiFi", "Kitchen", "Air Conditioning"],
            "pricing": {
                "nightly": mp["price"], 
                "monthly": mp["price"] * 25, 
                "cleaning_fee": 50.0, 
                "service_fee_percent": 10.0,
                "taxes_percent": 5.0,
                "minimum_nights": 1,
                "maximum_nights": 365
            },
            "badges": mp["badges"],
            "is_featured": mp["price"] > 500,
            "is_active": True,
            "status": "published",
            "suitable_for": mp["suitable"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.properties.insert_many(properties)
    
    # Seed services
    services = [
        {"id": str(uuid.uuid4()), "name": "Airport Pickup", "description": "Private car pickup from Dubai International Airport", "category": "transport", "price": 150.0, "price_type": "fixed", "icon": "plane-landing", "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Airport Drop-off", "description": "Private car drop-off to Dubai International Airport", "category": "transport", "price": 150.0, "price_type": "fixed", "icon": "plane-takeoff", "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Car Rental - Economy", "description": "Economy car rental with full insurance", "category": "car_rental", "price": 120.0, "price_type": "per_day", "icon": "car", "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Car Rental - SUV", "description": "SUV rental with full insurance, perfect for families", "category": "car_rental", "price": 250.0, "price_type": "per_day", "icon": "car", "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Dubai City Tour", "description": "Full day guided tour of Dubai's top attractions", "category": "tour", "price": 200.0, "price_type": "per_person", "icon": "map", "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Desert Safari", "description": "Evening desert safari with BBQ dinner and entertainment", "category": "tour", "price": 180.0, "price_type": "per_person", "icon": "sunset", "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Visa Assistance", "description": "UAE tourist visa processing and support", "category": "visa", "price": 350.0, "price_type": "fixed", "icon": "passport", "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Flight Booking Assistance", "description": "Help with booking flights to/from UAE", "category": "flight", "price": 50.0, "price_type": "fixed", "icon": "plane", "is_active": True}
    ]
    await db.services.insert_many(services)
    
    # Create default admin
    admin = {
        "id": str(uuid.uuid4()),
        "email": "admin@fairystar.ae",
        "password_hash": hash_password("admin123"),
        "name": "Admin User",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_users.insert_one(admin)
    
    # Create sample coordinators
    coordinators = [
        {"id": str(uuid.uuid4()), "name": "Sarah Ahmed", "email": "sarah@fairystar.ae", "phone": "+971506603525", "is_active": True, "assigned_bookings": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Mohammed Ali", "email": "mohammed@fairystar.ae", "phone": "+971507654321", "is_active": True, "assigned_bookings": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Fatima Khan", "email": "fatima@fairystar.ae", "phone": "+971509876543", "is_active": True, "assigned_bookings": 0, "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.coordinators.insert_many(coordinators)
    
    return {"message": "Data seeded successfully", "properties": len(properties), "services": len(services), "coordinators": len(coordinators)}

# ---------- COORDINATE MIGRATION ----------
AREA_COORDINATES = {
    "Dubai Marina": (25.0805, 55.1403),
    "Downtown Dubai": (25.1972, 55.2744),
    "Palm Jumeirah": (25.1124, 55.1390),
    "Healthcare City": (25.2288, 55.3174),
    "Al Majaz": (25.3382, 55.3910),
    "Al Hamra": (25.6941, 55.7843),
    "JBR": (25.0760, 55.1330),
    "Business Bay": (25.1859, 55.2625),
    "Dubai Silicon Oasis": (25.1236, 55.3783),
    "Al Majaz 3": (25.3346, 55.3880),
    "Al Hamra Village": (25.6850, 55.7750),
    "DIFC": (25.2104, 55.2797),
    "Al Barsha": (25.1142, 55.2003),
    "JLT": (25.0743, 55.1447),
    "Dubai Sports City": (25.0375, 55.2241),
    "Dubai Creek Harbour": (25.1933, 55.3433),
    "Corniche": (25.4000, 55.4350),
}

@api_router.post("/admin/migrate/coordinates")
async def migrate_coordinates(current_user: dict = Depends(get_current_admin)):
    check_permission(current_user, "all")
    import random
    count = 0
    async for prop in db.properties.find({}, {"_id": 0}):
        area = prop.get("area") or ""
        title = prop.get("title", "")
        
        # Try to match by area first, then title keywords
        coords = None
        if area and area in AREA_COORDINATES:
            coords = AREA_COORDINATES[area]
        else:
            for area_name, c in AREA_COORDINATES.items():
                if area_name.lower() in title.lower() or area_name.lower() in area.lower():
                    coords = c
                    if not prop.get("area"):
                        await db.properties.update_one({"id": prop["id"]}, {"$set": {"area": area_name}})
                    break
        
        if not coords:
            # Default to city center
            city = prop.get("city", "Dubai")
            city_coords = {"Dubai": (25.2048, 55.2708), "Sharjah": (25.3462, 55.4211), "Ras Al Khaimah": (25.7895, 55.9432), "Ajman": (25.4052, 55.5136), "Abu Dhabi": (24.4539, 54.3773)}
            coords = city_coords.get(city, (25.2048, 55.2708))
        
        lat = coords[0] + random.uniform(-0.008, 0.008)
        lng = coords[1] + random.uniform(-0.008, 0.008)
        await db.properties.update_one({"id": prop["id"]}, {"$set": {"map_lat": round(lat, 6), "map_lng": round(lng, 6)}})
        count += 1
    return {"message": f"Updated {count} properties with coordinates"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
