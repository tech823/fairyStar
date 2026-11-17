"""
Comprehensive Backend Tests for Fairy Star Vacation Homes
Tests: Properties, Bookings, Payments, Admin Auth
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_PROPERTY_ID = None
TEST_BOOKING_ID = None
TEST_ADMIN_TOKEN = None

class TestAPIHealth:
    """Health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Fairy Star Vacation Homes API"
        assert data["version"] == "1.0.0"
        print("✓ API root endpoint working")


class TestProperties:
    """Property listing and detail tests"""
    
    def test_get_all_properties(self):
        """Test fetching all properties"""
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Found {len(data)} properties")
        
        # Store first property ID for later tests
        global TEST_PROPERTY_ID
        TEST_PROPERTY_ID = data[0]["id"]
        
        # Validate property structure
        prop = data[0]
        assert "id" in prop
        assert "title" in prop
        assert "pricing" in prop
        assert "nightly" in prop["pricing"]
        print("✓ Property structure validated")
    
    def test_get_property_by_id(self):
        """Test fetching single property"""
        global TEST_PROPERTY_ID
        if not TEST_PROPERTY_ID:
            pytest.skip("No property ID available")
        
        response = requests.get(f"{BASE_URL}/api/properties/{TEST_PROPERTY_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TEST_PROPERTY_ID
        print(f"✓ Property detail fetched: {data['title']}")
    
    def test_filter_properties_by_city(self):
        """Test filtering properties by city"""
        response = requests.get(f"{BASE_URL}/api/properties?city=Dubai")
        assert response.status_code == 200
        data = response.json()
        for prop in data:
            assert prop["city"] == "Dubai"
        print(f"✓ City filter working - {len(data)} Dubai properties")
    
    def test_filter_properties_by_guests(self):
        """Test filtering properties by guest count"""
        response = requests.get(f"{BASE_URL}/api/properties?guests=4")
        assert response.status_code == 200
        data = response.json()
        for prop in data:
            assert prop["max_guests"] >= 4
        print(f"✓ Guest filter working - {len(data)} properties for 4+ guests")
    
    def test_featured_properties(self):
        """Test fetching featured properties"""
        response = requests.get(f"{BASE_URL}/api/properties?featured=true")
        assert response.status_code == 200
        data = response.json()
        for prop in data:
            assert prop["is_featured"] == True
        print(f"✓ Featured filter working - {len(data)} featured properties")


class TestBookingCalculation:
    """Booking calculation API tests"""
    
    def test_calculate_booking_valid(self):
        """Test booking calculation with valid dates"""
        global TEST_PROPERTY_ID
        if not TEST_PROPERTY_ID:
            # Get a property first
            props = requests.get(f"{BASE_URL}/api/properties").json()
            TEST_PROPERTY_ID = props[0]["id"]
        
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/bookings/calculate",
            params={
                "property_id": TEST_PROPERTY_ID,
                "check_in": check_in,
                "check_out": check_out,
                "guests": 2
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate calculation response
        assert "nights" in data
        assert data["nights"] == 3
        assert "base_price" in data
        assert "cleaning_fee" in data
        assert "service_fee" in data
        assert "total" in data
        assert "deposit" in data
        assert data["deposit"] == round(data["total"] * 0.3, 2)
        print(f"✓ Booking calculation: {data['nights']} nights, Total: AED {data['total']}")
    
    def test_calculate_booking_invalid_dates(self):
        """Test booking calculation with invalid date range"""
        global TEST_PROPERTY_ID
        check_in = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")  # Before check-in
        
        response = requests.post(
            f"{BASE_URL}/api/bookings/calculate",
            params={
                "property_id": TEST_PROPERTY_ID,
                "check_in": check_in,
                "check_out": check_out,
                "guests": 2
            }
        )
        assert response.status_code == 400
        print("✓ Invalid date range properly rejected")
    
    def test_calculate_booking_nonexistent_property(self):
        """Test booking calculation with non-existent property"""
        response = requests.post(
            f"{BASE_URL}/api/bookings/calculate",
            params={
                "property_id": "nonexistent-id-12345",
                "check_in": "2026-03-01",
                "check_out": "2026-03-05",
                "guests": 2
            }
        )
        assert response.status_code == 404
        print("✓ Non-existent property properly rejected")


class TestBookingCreation:
    """Booking creation API tests"""
    
    def test_create_booking(self):
        """Test creating a new booking"""
        global TEST_PROPERTY_ID, TEST_BOOKING_ID
        if not TEST_PROPERTY_ID:
            props = requests.get(f"{BASE_URL}/api/properties").json()
            TEST_PROPERTY_ID = props[0]["id"]
        
        check_in = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=17)).strftime("%Y-%m-%d")
        
        booking_data = {
            "property_id": TEST_PROPERTY_ID,
            "guest_name": "Test Guest",
            "guest_email": "test@example.com",
            "guest_phone": "+971501234567",
            "check_in": check_in,
            "check_out": check_out,
            "guests": 2,
            "add_ons": [],
            "payment_type": "deposit"
        }
        
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "booking_id" in data
        assert "total" in data
        assert "deposit" in data
        TEST_BOOKING_ID = data["booking_id"]
        print(f"✓ Booking created: {TEST_BOOKING_ID}, Total: AED {data['total']}")
    
    def test_get_booking_by_id(self):
        """Test fetching booking by ID"""
        global TEST_BOOKING_ID
        if not TEST_BOOKING_ID:
            pytest.skip("No booking ID available")
        
        response = requests.get(f"{BASE_URL}/api/bookings/{TEST_BOOKING_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Validate booking structure for success page
        assert data["id"] == TEST_BOOKING_ID
        assert "property_title" in data
        assert "guest_name" in data
        assert "guest_email" in data
        assert "guest_phone" in data
        assert "check_in" in data
        assert "check_out" in data
        assert "guests" in data
        assert "nights" in data
        assert "base_price" in data
        assert "cleaning_fee" in data
        assert "service_fee" in data
        assert "total_amount" in data
        assert "deposit_amount" in data
        assert "payment_type" in data
        print(f"✓ Booking details fetched: {data['property_title']}")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        global TEST_ADMIN_TOKEN
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@fairystar.ae",
                "password": "admin123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@fairystar.ae"
        TEST_ADMIN_TOKEN = data["token"]
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@fairystar.ae",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        print("✓ Invalid credentials properly rejected")
    
    def test_admin_me_endpoint(self):
        """Test admin /me endpoint with token"""
        global TEST_ADMIN_TOKEN
        if not TEST_ADMIN_TOKEN:
            pytest.skip("No admin token available")
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@fairystar.ae"
        print("✓ Admin /me endpoint working")


class TestAdminDashboard:
    """Admin dashboard API tests"""
    
    def test_admin_stats(self):
        """Test admin stats endpoint"""
        global TEST_ADMIN_TOKEN
        if not TEST_ADMIN_TOKEN:
            # Login first
            login_res = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": "admin@fairystar.ae", "password": "admin123"}
            )
            TEST_ADMIN_TOKEN = login_res.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {TEST_ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_properties" in data
        assert "total_bookings" in data
        assert "confirmed_bookings" in data
        assert "total_leads" in data
        assert "total_revenue" in data
        print(f"✓ Admin stats: {data['total_properties']} properties, {data['total_bookings']} bookings")
    
    def test_admin_get_bookings(self):
        """Test admin bookings list endpoint"""
        global TEST_ADMIN_TOKEN
        response = requests.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {TEST_ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin can view {len(data)} bookings")


class TestServices:
    """Add-on services tests"""
    
    def test_get_services(self):
        """Test fetching add-on services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            svc = data[0]
            assert "id" in svc
            assert "name" in svc
            assert "price" in svc
            assert "category" in svc
        print(f"✓ Found {len(data)} add-on services")


class TestLeads:
    """Lead/inquiry tests"""
    
    def test_create_lead(self):
        """Test creating a new lead"""
        lead_data = {
            "lead_type": "guest",
            "name": "Test Lead",
            "email": "testlead@example.com",
            "phone": "+971501234567",
            "city": "Dubai",
            "message": "Test inquiry"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == "Test Lead"
        assert data["status"] == "new"
        print(f"✓ Lead created: {data['id']}")


class TestPaymentStatus:
    """Payment status API tests"""
    
    def test_payment_status_invalid_session(self):
        """Test payment status with invalid session ID"""
        response = requests.get(f"{BASE_URL}/api/payments/status/invalid_session_id")
        # Should return error or empty status
        # The API might return 200 with error status or 4xx
        print(f"✓ Payment status endpoint responds: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
