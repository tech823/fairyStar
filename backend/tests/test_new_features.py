"""
Test suite for Fairy Star Vacation Homes - New Features (Iteration 10)
Tests: Map view toggle, Customer Journey page, CRM Webhook settings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@fairystar.ae"
ADMIN_PASSWORD = "admin123"

@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")

@pytest.fixture
def auth_headers(admin_token):
    """Auth headers for admin requests"""
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


class TestPropertiesWithCoordinates:
    """Test properties API returns map coordinates"""
    
    def test_properties_list_returns_coordinates(self):
        """Properties list should include map_lat and map_lng fields"""
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        
        properties = response.json()
        assert len(properties) > 0, "Should have properties"
        
        # Check that at least some properties have coordinates
        properties_with_coords = [p for p in properties if p.get('map_lat') and p.get('map_lng')]
        assert len(properties_with_coords) > 0, "Should have properties with coordinates"
        
        # Verify coordinate values are valid
        for prop in properties_with_coords:
            lat = prop.get('map_lat')
            lng = prop.get('map_lng')
            assert isinstance(lat, (int, float)), f"Latitude should be numeric: {lat}"
            assert isinstance(lng, (int, float)), f"Longitude should be numeric: {lng}"
            assert 20 <= lat <= 30, f"UAE latitude should be between 20-30: {lat}"  # UAE range
            assert 50 <= lng <= 60, f"UAE longitude should be between 50-60: {lng}"  # UAE range
        
        print(f"Found {len(properties_with_coords)} properties with valid coordinates")
    
    def test_single_property_has_coordinates(self):
        """Single property endpoint should return coordinates"""
        # First get list to find a property with coordinates
        response = requests.get(f"{BASE_URL}/api/properties")
        properties = response.json()
        
        prop_with_coords = next((p for p in properties if p.get('map_lat')), None)
        if not prop_with_coords:
            pytest.skip("No property with coordinates found")
        
        # Get single property
        prop_id = prop_with_coords.get('id') or prop_with_coords.get('slug')
        response = requests.get(f"{BASE_URL}/api/properties/{prop_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert 'map_lat' in data, "Single property should have map_lat"
        assert 'map_lng' in data, "Single property should have map_lng"
        print(f"Property {data['title']} has coordinates: ({data['map_lat']}, {data['map_lng']})")


class TestCRMWebhookSettings:
    """Test CRM Webhook settings CRUD endpoints"""
    
    def test_get_crm_settings(self, auth_headers):
        """GET /api/admin/crm/settings should return CRM settings"""
        response = requests.get(f"{BASE_URL}/api/admin/crm/settings", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert 'enabled' in data, "Should have 'enabled' field"
        assert 'webhook_url' in data, "Should have 'webhook_url' field"
        print(f"CRM Settings: enabled={data.get('enabled')}, url={data.get('webhook_url', '')[:30]}...")
    
    def test_update_crm_settings(self, auth_headers):
        """PUT /api/admin/crm/settings should update settings"""
        test_url = "https://webhook.test.example.com/crm"
        
        response = requests.put(f"{BASE_URL}/api/admin/crm/settings", headers=auth_headers, json={
            "webhook_url": test_url,
            "enabled": False,
            "include_fields": []
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("message") == "CRM settings updated"
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/admin/crm/settings", headers=auth_headers)
        assert get_response.status_code == 200
        
        saved_data = get_response.json()
        assert saved_data.get("webhook_url") == test_url
        print("✓ CRM settings updated and persisted successfully")
    
    def test_crm_settings_requires_auth(self):
        """CRM settings endpoints should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/crm/settings")
        assert response.status_code == 401, "Should require auth"
        
        response = requests.put(f"{BASE_URL}/api/admin/crm/settings", json={
            "webhook_url": "https://test.com",
            "enabled": False,
            "include_fields": []
        })
        assert response.status_code == 401, "Should require auth for PUT"
    
    def test_crm_test_endpoint_requires_auth(self):
        """POST /api/admin/crm/test should require authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/crm/test")
        assert response.status_code == 401, "Test endpoint should require auth"


class TestCustomerJourneyPage:
    """Test that Customer Journey page routes work (frontend routing, not backend)"""
    
    def test_journey_page_accessible(self):
        """Journey page should be accessible at /journey"""
        # This tests the frontend is serving the page
        response = requests.get(f"{BASE_URL}/journey", allow_redirects=True)
        # Frontend pages return 200 or redirect to main page
        assert response.status_code in [200, 304], f"Journey page should be accessible, got {response.status_code}"


class TestHealthConfig:
    """Test health/config endpoint includes storage and email status"""
    
    def test_health_config_endpoint(self):
        """GET /api/health/config should return configuration status"""
        response = requests.get(f"{BASE_URL}/api/health/config")
        assert response.status_code == 200
        
        data = response.json()
        assert 'status' in data
        assert 'storage' in data
        assert 'email' in data
        
        # Check storage config structure
        storage = data['storage']
        assert 'enabled' in storage
        assert 'provider' in storage
        
        # Check email config structure
        email = data['email']
        assert 'enabled' in email
        
        print(f"Config: storage_enabled={storage['enabled']}, email_enabled={email['enabled']}")


class TestAdminPropertiesCoordinates:
    """Test admin property form coordinate fields"""
    
    def test_property_update_with_coordinates(self, auth_headers):
        """Admin should be able to update property with coordinates"""
        # Get a property first
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        
        properties = response.json()
        if not properties:
            pytest.skip("No properties available")
        
        prop_id = properties[0]['id']
        
        # Update with new coordinates
        new_lat = 25.123456
        new_lng = 55.654321
        
        response = requests.put(f"{BASE_URL}/api/admin/properties/{prop_id}", headers=auth_headers, json={
            "map_lat": new_lat,
            "map_lng": new_lng
        })
        assert response.status_code == 200
        
        # Verify update
        data = response.json()
        assert data.get('map_lat') == new_lat, f"Latitude should be {new_lat}"
        assert data.get('map_lng') == new_lng, f"Longitude should be {new_lng}"
        
        print(f"✓ Property coordinates updated to ({new_lat}, {new_lng})")
        
        # Restore original coordinates if they existed
        original_lat = properties[0].get('map_lat')
        original_lng = properties[0].get('map_lng')
        if original_lat and original_lng:
            requests.put(f"{BASE_URL}/api/admin/properties/{prop_id}", headers=auth_headers, json={
                "map_lat": original_lat,
                "map_lng": original_lng
            })


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
