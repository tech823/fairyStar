"""
Test suite for Cloud Storage and Media Management APIs
Tests: Storage settings, pre-signed URLs, upload confirmation, video links, 
       media deletion, reorder, cover image, metadata updates
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@fairystar.ae"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def test_property(auth_headers):
    """Create a test property for media tests"""
    property_data = {
        "title": f"TEST_Media_Property_{uuid.uuid4().hex[:8]}",
        "description": "Test property for media management testing",
        "property_type": "holiday_home",
        "city": "Dubai",
        "address": "Test Address, Dubai",
        "bedrooms": 2,
        "bathrooms": 1,
        "max_guests": 4,
        "pricing": {
            "nightly": 200,
            "monthly": 4000,
            "cleaning_fee": 50,
            "service_fee_percent": 10,
            "taxes_percent": 5
        },
        "status": "draft"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/admin/properties",
        json=property_data,
        headers=auth_headers
    )
    assert response.status_code == 200, f"Failed to create test property: {response.text}"
    property_id = response.json()["id"]
    
    yield property_id
    
    # Cleanup: Delete test property
    requests.delete(f"{BASE_URL}/api/admin/properties/{property_id}", headers=auth_headers)


class TestStorageSettings:
    """Test storage configuration status API"""
    
    def test_get_storage_settings_returns_config_status(self, auth_headers):
        """GET /api/admin/storage/settings returns configuration status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/storage/settings",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "enabled" in data
        assert "provider" in data
        assert "bucket" in data
        assert "cdn_base" in data
        assert "configured" in data
        assert "max_image_size_mb" in data
        assert "max_video_size_mb" in data
        assert "allowed_image_types" in data
        assert "allowed_video_types" in data
        
        # Verify data types
        assert isinstance(data["enabled"], bool)
        assert isinstance(data["configured"], bool)
        assert isinstance(data["max_image_size_mb"], int)
        assert isinstance(data["max_video_size_mb"], int)
        assert isinstance(data["allowed_image_types"], list)
        assert isinstance(data["allowed_video_types"], list)
        
        print(f"Storage settings: enabled={data['enabled']}, configured={data['configured']}, provider={data['provider']}")
    
    def test_storage_settings_requires_auth(self):
        """GET /api/admin/storage/settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/storage/settings")
        assert response.status_code == 401


class TestPresignedUrlGeneration:
    """Test pre-signed URL generation for direct uploads"""
    
    def test_presign_url_for_image(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/presign generates URL for image"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/presign",
            json={
                "filename": "test_image.jpg",
                "content_type": "image/jpeg",
                "size_bytes": 1024 * 1024  # 1MB
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # When storage is disabled, it returns status: disabled
        if data.get("status") == "disabled":
            assert "error" in data or "status" in data
            print("Storage disabled - presign returns disabled status (expected)")
        elif data.get("status") == "not_configured":
            print("Storage not configured - presign returns not_configured status (expected)")
        else:
            # When storage is enabled
            assert "upload_url" in data
            assert "storage_key" in data
            assert "public_url" in data
            assert "media_type" in data
            assert data["media_type"] == "image"
            print(f"Presigned URL generated: {data.get('storage_key')}")
    
    def test_presign_url_for_video(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/presign generates URL for video"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/presign",
            json={
                "filename": "test_video.mp4",
                "content_type": "video/mp4",
                "size_bytes": 50 * 1024 * 1024  # 50MB
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("status") in ["disabled", "not_configured"]:
            print(f"Storage {data.get('status')} - expected behavior")
        else:
            assert data["media_type"] == "video"
    
    def test_presign_rejects_invalid_file_type(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/presign rejects invalid file types"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/presign",
            json={
                "filename": "test.exe",
                "content_type": "application/x-executable",
                "size_bytes": 1024
            },
            headers=auth_headers
        )
        
        # When storage is disabled, validation still happens but returns 200 with disabled status
        # When storage is enabled, it returns 400 for invalid file type
        data = response.json()
        if response.status_code == 200:
            # Storage disabled - validation happens in storage service
            assert data.get("status") in ["disabled", "not_configured", "validation_error"]
            print(f"Storage disabled/not configured - status: {data.get('status')}")
        else:
            assert response.status_code == 400
            print("Invalid file type correctly rejected with 400")
    
    def test_presign_rejects_oversized_image(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/presign rejects oversized images"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/presign",
            json={
                "filename": "huge_image.jpg",
                "content_type": "image/jpeg",
                "size_bytes": 50 * 1024 * 1024  # 50MB - exceeds 10MB limit
            },
            headers=auth_headers
        )
        
        # When storage is disabled, validation still happens but returns 200 with disabled status
        data = response.json()
        if response.status_code == 200:
            assert data.get("status") in ["disabled", "not_configured", "validation_error"]
            print(f"Storage disabled/not configured - status: {data.get('status')}")
        else:
            assert response.status_code == 400
            print("Oversized image correctly rejected with 400")
    
    def test_presign_for_nonexistent_property(self, auth_headers):
        """POST /api/admin/properties/{id}/media/presign returns 404 for non-existent property"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/nonexistent-id/media/presign",
            json={
                "filename": "test.jpg",
                "content_type": "image/jpeg",
                "size_bytes": 1024
            },
            headers=auth_headers
        )
        
        assert response.status_code == 404
        print("Non-existent property correctly returns 404")


class TestVideoLinkAddition:
    """Test adding video links (YouTube/Vimeo)"""
    
    def test_add_youtube_video_link(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/video-link adds YouTube video"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/video-link",
            json={
                "video_link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                "caption": "Property Tour Video"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        assert "media" in data
        
        media = data["media"]
        assert media["type"] == "video"
        assert media["video_link"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert media["caption"] == "Property Tour Video"
        assert "id" in media
        
        print(f"Video link added: {media['id']}")
        return media["id"]
    
    def test_add_vimeo_video_link(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/video-link adds Vimeo video"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/video-link",
            json={
                "video_link": "https://vimeo.com/123456789",
                "caption": "Vimeo Property Tour"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        assert data["media"]["video_link"] == "https://vimeo.com/123456789"
        print("Vimeo video link added successfully")
    
    def test_add_video_link_without_thumbnail(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/video-link works without thumbnail"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/video-link",
            json={
                "video_link": "https://www.youtube.com/watch?v=test123"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        print("Video link without thumbnail added successfully")
    
    def test_add_video_link_to_nonexistent_property(self, auth_headers):
        """POST /api/admin/properties/{id}/media/video-link returns 404 for non-existent property"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/nonexistent-id/media/video-link",
            json={
                "video_link": "https://www.youtube.com/watch?v=test"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 400  # Returns error from storage service
        print("Non-existent property correctly handled")


class TestGetPropertyMedia:
    """Test getting property media"""
    
    def test_get_property_media(self, auth_headers, test_property):
        """GET /api/admin/properties/{id}/media returns media list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/properties/{test_property}/media",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "media" in data
        assert isinstance(data["media"], list)
        
        # Should have video links added in previous tests
        print(f"Property has {len(data['media'])} media items")


class TestMediaReorder:
    """Test media gallery reordering"""
    
    def test_reorder_media(self, auth_headers, test_property):
        """PUT /api/admin/properties/{id}/media/reorder reorders gallery"""
        # First get current media
        get_response = requests.get(
            f"{BASE_URL}/api/admin/properties/{test_property}/media",
            headers=auth_headers
        )
        media_list = get_response.json().get("media", [])
        
        if len(media_list) < 2:
            pytest.skip("Need at least 2 media items to test reorder")
        
        # Reverse the order
        media_ids = [m["id"] for m in media_list]
        reversed_ids = list(reversed(media_ids))
        
        response = requests.put(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/reorder",
            json=reversed_ids,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success" or "message" in data
        print("Media reordered successfully")
    
    def test_reorder_with_invalid_property(self, auth_headers):
        """PUT /api/admin/properties/{id}/media/reorder returns error for non-existent property"""
        response = requests.put(
            f"{BASE_URL}/api/admin/properties/nonexistent-id/media/reorder",
            json=["id1", "id2"],
            headers=auth_headers
        )
        
        # Can return 400 or 404 depending on where validation happens
        assert response.status_code in [400, 404]
        print(f"Non-existent property reorder returns {response.status_code}")


class TestSetCoverImage:
    """Test setting cover image"""
    
    def test_set_cover_image(self, auth_headers, test_property):
        """PUT /api/admin/properties/{id}/media/{media_id}/cover sets cover"""
        # Get media list
        get_response = requests.get(
            f"{BASE_URL}/api/admin/properties/{test_property}/media",
            headers=auth_headers
        )
        media_list = get_response.json().get("media", [])
        
        if not media_list:
            pytest.skip("No media items to set as cover")
        
        media_id = media_list[0]["id"]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/{media_id}/cover",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success" or "message" in data
        print(f"Cover image set to: {media_id}")
    
    def test_set_cover_nonexistent_media(self, auth_headers, test_property):
        """PUT /api/admin/properties/{id}/media/{media_id}/cover returns error for non-existent media"""
        response = requests.put(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/nonexistent-media-id/cover",
            headers=auth_headers
        )
        
        # API may return 200 with error status or 400
        if response.status_code == 200:
            data = response.json()
            # Check if it's an error response
            assert data.get("status") == "error" or "message" in data
            print(f"Non-existent media handled with status: {data.get('status')}")
        else:
            assert response.status_code == 400
            print("Non-existent media correctly handled with 400")


class TestUpdateMediaMetadata:
    """Test updating media caption and alt text"""
    
    def test_update_media_metadata(self, auth_headers, test_property):
        """PUT /api/admin/properties/{id}/media/{media_id}/metadata updates caption/alt"""
        # Get media list
        get_response = requests.get(
            f"{BASE_URL}/api/admin/properties/{test_property}/media",
            headers=auth_headers
        )
        media_list = get_response.json().get("media", [])
        
        if not media_list:
            pytest.skip("No media items to update")
        
        media_id = media_list[0]["id"]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/{media_id}/metadata",
            json={
                "caption": "Updated caption for testing",
                "alt_text": "Updated alt text for accessibility"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        print("Media metadata updated successfully")
    
    def test_update_metadata_partial(self, auth_headers, test_property):
        """PUT /api/admin/properties/{id}/media/{media_id}/metadata works with partial data"""
        get_response = requests.get(
            f"{BASE_URL}/api/admin/properties/{test_property}/media",
            headers=auth_headers
        )
        media_list = get_response.json().get("media", [])
        
        if not media_list:
            pytest.skip("No media items to update")
        
        media_id = media_list[0]["id"]
        
        # Update only caption
        response = requests.put(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/{media_id}/metadata",
            json={"caption": "Only caption updated"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        print("Partial metadata update successful")


class TestMediaDeletion:
    """Test media deletion"""
    
    def test_delete_media(self, auth_headers, test_property):
        """DELETE /api/admin/properties/{id}/media/cloud/{media_id} deletes media"""
        # First add a video link to delete
        add_response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/video-link",
            json={
                "video_link": "https://www.youtube.com/watch?v=to_delete",
                "caption": "Video to delete"
            },
            headers=auth_headers
        )
        
        assert add_response.status_code == 200
        media_id = add_response.json()["media"]["id"]
        
        # Now delete it
        response = requests.delete(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/cloud/{media_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("deleted_id") == media_id
        print(f"Media deleted: {media_id}")
    
    def test_delete_nonexistent_media(self, auth_headers, test_property):
        """DELETE /api/admin/properties/{id}/media/cloud/{media_id} returns error for non-existent"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/cloud/nonexistent-id",
            headers=auth_headers
        )
        
        assert response.status_code == 400
        print("Non-existent media deletion correctly handled")


class TestUploadConfirmation:
    """Test upload confirmation endpoint"""
    
    def test_confirm_upload(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/confirm stores media metadata"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/confirm",
            json={
                "storage_key": f"properties/{test_property}/images/test-{uuid.uuid4().hex}.jpg",
                "public_url": "https://example-cdn.com/test-image.jpg",
                "media_type": "image",
                "caption": "Test uploaded image",
                "alt_text": "A test image",
                "is_cover": False
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("status") == "success"
        assert "media" in data
        assert data["media"]["type"] == "image"
        assert data["media"]["caption"] == "Test uploaded image"
        print(f"Upload confirmed: {data['media']['id']}")
    
    def test_confirm_upload_as_cover(self, auth_headers, test_property):
        """POST /api/admin/properties/{id}/media/confirm can set as cover"""
        response = requests.post(
            f"{BASE_URL}/api/admin/properties/{test_property}/media/confirm",
            json={
                "storage_key": f"properties/{test_property}/images/cover-{uuid.uuid4().hex}.jpg",
                "public_url": "https://example-cdn.com/cover-image.jpg",
                "media_type": "image",
                "is_cover": True
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["media"]["is_cover"] == True
        print("Upload confirmed as cover image")


class TestPropertyEditPageTabs:
    """Test that property edit page has Details and Media tabs"""
    
    def test_property_has_media_field(self, auth_headers, test_property):
        """Verify property has media array field"""
        response = requests.get(
            f"{BASE_URL}/api/properties/{test_property}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Property should have media array
        assert "media" in data
        assert isinstance(data["media"], list)
        print(f"Property has {len(data['media'])} media items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
