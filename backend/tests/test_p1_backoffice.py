"""
P1 Backoffice API Tests - Fairy Star Vacation Homes
Tests for: Admin Auth, Properties CRUD, Bookings Management, Leads CRM, 
Coordinators, Service Requests, Audit Logging, RBAC
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@fairystar.ae"
ADMIN_PASSWORD = "admin123"


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == ADMIN_EMAIL
        assert "role" in data["user"], "Role not in user data"
        print(f"✓ Admin login successful, role: {data['user']['role']}")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint returns current user"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["token"]
        
        # Get current user
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert "role" in data
        print(f"✓ Auth/me returns user: {data['email']}, role: {data['role']}")
    
    def test_protected_endpoint_without_token(self):
        """Test that protected endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Protected endpoint correctly requires auth")


class TestAdminDashboardStats:
    """Admin dashboard statistics tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_admin_stats(self):
        """Test admin stats endpoint returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required stats fields
        required_fields = [
            "total_properties", "total_bookings", "confirmed_bookings",
            "pending_bookings", "total_leads", "new_leads", "total_revenue",
            "unassigned_bookings", "upcoming_checkins"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Dashboard stats: {data['total_properties']} properties, {data['total_bookings']} bookings, AED {data['total_revenue']} revenue")


class TestPropertiesManagement:
    """Properties CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_properties(self):
        """Test listing properties"""
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} properties")
    
    def test_list_properties_with_filters(self):
        """Test listing properties with filters"""
        # Filter by city
        response = requests.get(f"{BASE_URL}/api/properties?city=Dubai")
        assert response.status_code == 200
        data = response.json()
        for prop in data:
            assert prop["city"] == "Dubai"
        print(f"✓ Filtered properties by city: {len(data)} Dubai properties")
    
    def test_create_property(self):
        """Test creating a new property via admin"""
        test_property = {
            "title": f"TEST_Property_{uuid.uuid4().hex[:8]}",
            "description": "Test property for automated testing",
            "property_type": "holiday_home",
            "city": "Dubai",
            "area": "Test Area",
            "address": "123 Test Street",
            "bedrooms": 2,
            "beds": 2,
            "bathrooms": 1,
            "max_guests": 4,
            "amenities": ["WiFi", "Pool"],
            "pricing": {
                "nightly": 300,
                "monthly": 6000,
                "cleaning_fee": 75,
                "service_fee_percent": 10,
                "taxes_percent": 5,
                "minimum_nights": 1,
                "maximum_nights": 365
            },
            "badges": ["Verified"],
            "status": "published"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/properties", 
                                json=test_property, headers=self.headers)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data, "Property ID not returned"
        
        # Verify property was created by fetching it
        prop_id = data["id"]
        get_response = requests.get(f"{BASE_URL}/api/properties/{prop_id}")
        assert get_response.status_code == 200
        created_prop = get_response.json()
        assert created_prop["title"] == test_property["title"]
        assert created_prop["pricing"]["nightly"] == 300
        
        print(f"✓ Created property: {prop_id}")
        return prop_id
    
    def test_update_property(self):
        """Test updating a property"""
        # First create a property
        test_property = {
            "title": f"TEST_Update_{uuid.uuid4().hex[:8]}",
            "description": "Property to update",
            "property_type": "holiday_home",
            "city": "Dubai",
            "address": "Update Test Street",
            "bedrooms": 1,
            "bathrooms": 1,
            "max_guests": 2,
            "pricing": {
                "nightly": 200,
                "monthly": 4000,
                "cleaning_fee": 50,
                "service_fee_percent": 10,
                "taxes_percent": 5,
                "minimum_nights": 1,
                "maximum_nights": 365
            },
            "status": "draft"
        }
        
        create_res = requests.post(f"{BASE_URL}/api/admin/properties", 
                                  json=test_property, headers=self.headers)
        prop_id = create_res.json()["id"]
        
        # Update the property
        update_data = {
            "title": "TEST_Updated_Title",
            "status": "published",
            "pricing": {
                "nightly": 250,
                "monthly": 5000,
                "cleaning_fee": 60,
                "service_fee_percent": 10,
                "taxes_percent": 5,
                "minimum_nights": 2,
                "maximum_nights": 365
            }
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/properties/{prop_id}", 
                               json=update_data, headers=self.headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/properties/{prop_id}")
        updated_prop = get_response.json()
        assert updated_prop["title"] == "TEST_Updated_Title"
        assert updated_prop["status"] == "published"
        assert updated_prop["pricing"]["nightly"] == 250
        
        print(f"✓ Updated property: {prop_id}")


class TestBookingsManagement:
    """Bookings management tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_admin_bookings(self):
        """Test listing bookings via admin endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} bookings")
    
    def test_list_bookings_with_filters(self):
        """Test listing bookings with status and payment filters"""
        # Filter by status
        response = requests.get(f"{BASE_URL}/api/admin/bookings?status=pending", 
                               headers=self.headers)
        assert response.status_code == 200
        
        # Filter by payment status
        response = requests.get(f"{BASE_URL}/api/admin/bookings?payment_status=paid", 
                               headers=self.headers)
        assert response.status_code == 200
        print("✓ Booking filters working")
    
    def test_update_booking_status(self):
        """Test updating booking status"""
        # First get a booking
        bookings_res = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        bookings = bookings_res.json()
        
        if len(bookings) == 0:
            # Create a test booking first
            props_res = requests.get(f"{BASE_URL}/api/properties")
            props = props_res.json()
            if len(props) > 0:
                prop_id = props[0]["id"]
                check_in = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
                check_out = (datetime.now() + timedelta(days=33)).strftime("%Y-%m-%d")
                
                booking_data = {
                    "property_id": prop_id,
                    "guest_name": "TEST_Guest",
                    "guest_email": "test@example.com",
                    "guest_phone": "+971501234567",
                    "check_in": check_in,
                    "check_out": check_out,
                    "guests": 2,
                    "payment_type": "deposit"
                }
                create_res = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
                if create_res.status_code == 200:
                    booking_id = create_res.json()["booking_id"]
                else:
                    pytest.skip("Could not create test booking")
            else:
                pytest.skip("No properties available for booking test")
        else:
            booking_id = bookings[0]["id"]
        
        # Update booking status
        response = requests.put(f"{BASE_URL}/api/admin/bookings/{booking_id}", 
                               json={"booking_status": "confirmed"}, 
                               headers=self.headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        print(f"✓ Updated booking status: {booking_id}")


class TestCoordinatorAssignment:
    """Coordinator assignment tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_coordinators(self):
        """Test listing coordinators"""
        response = requests.get(f"{BASE_URL}/api/admin/coordinators", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} coordinators")
        return data
    
    def test_create_coordinator(self):
        """Test creating a new coordinator"""
        coordinator_data = {
            "name": f"TEST_Coordinator_{uuid.uuid4().hex[:6]}",
            "email": f"test_{uuid.uuid4().hex[:6]}@fairystar.ae",
            "phone": "+971501234567"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/coordinators", 
                                json=coordinator_data, headers=self.headers)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "coordinator" in data
        
        # Verify coordinator was created
        coord_id = data["coordinator"]["id"]
        list_res = requests.get(f"{BASE_URL}/api/admin/coordinators", headers=self.headers)
        coordinators = list_res.json()
        coord_ids = [c["id"] for c in coordinators]
        assert coord_id in coord_ids
        
        print(f"✓ Created coordinator: {coord_id}")
        return coord_id
    
    def test_assign_coordinator_to_booking(self):
        """Test assigning coordinator to a booking"""
        # Get or create a coordinator
        coord_res = requests.get(f"{BASE_URL}/api/admin/coordinators", headers=self.headers)
        coordinators = coord_res.json()
        
        if len(coordinators) == 0:
            # Create one
            coord_data = {
                "name": "TEST_AssignCoord",
                "email": f"assign_{uuid.uuid4().hex[:6]}@fairystar.ae",
                "phone": "+971501234567"
            }
            create_res = requests.post(f"{BASE_URL}/api/admin/coordinators", 
                                      json=coord_data, headers=self.headers)
            coordinator_id = create_res.json()["coordinator"]["id"]
        else:
            coordinator_id = coordinators[0]["id"]
        
        # Get a booking
        bookings_res = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        bookings = bookings_res.json()
        
        if len(bookings) == 0:
            pytest.skip("No bookings available for coordinator assignment test")
        
        booking_id = bookings[0]["id"]
        
        # Assign coordinator
        response = requests.put(
            f"{BASE_URL}/api/admin/bookings/{booking_id}/assign-coordinator?coordinator_id={coordinator_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Assignment failed: {response.text}"
        
        # Verify assignment
        booking_res = requests.get(f"{BASE_URL}/api/admin/bookings/{booking_id}", 
                                  headers=self.headers)
        booking = booking_res.json()
        assert booking["coordinator_id"] == coordinator_id
        
        print(f"✓ Assigned coordinator {coordinator_id} to booking {booking_id}")


class TestLeadsManagement:
    """Leads CRM tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_leads(self):
        """Test listing leads"""
        response = requests.get(f"{BASE_URL}/api/admin/leads", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} leads")
    
    def test_create_lead(self):
        """Test creating a new lead"""
        lead_data = {
            "lead_type": "guest",
            "name": f"TEST_Lead_{uuid.uuid4().hex[:6]}",
            "email": f"lead_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "+971501234567",
            "city": "Dubai",
            "message": "Test lead for automated testing"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        
        # Verify lead was created
        lead_id = data["id"]
        leads_res = requests.get(f"{BASE_URL}/api/admin/leads", headers=self.headers)
        leads = leads_res.json()
        lead_ids = [l["id"] for l in leads]
        assert lead_id in lead_ids
        
        print(f"✓ Created lead: {lead_id}")
        return lead_id
    
    def test_update_lead_status(self):
        """Test updating lead status"""
        # Create a lead first
        lead_data = {
            "lead_type": "corporate",
            "name": f"TEST_StatusLead_{uuid.uuid4().hex[:6]}",
            "email": f"status_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "+971501234567"
        }
        create_res = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        lead_id = create_res.json()["id"]
        
        # Update status
        response = requests.put(f"{BASE_URL}/api/admin/leads/{lead_id}", 
                               json={"status": "contacted"}, 
                               headers=self.headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify update
        updated_lead = response.json()
        assert updated_lead["status"] == "contacted"
        
        print(f"✓ Updated lead status to 'contacted': {lead_id}")
    
    def test_assign_coordinator_to_lead(self):
        """Test assigning coordinator to a lead"""
        # Get or create a coordinator
        coord_res = requests.get(f"{BASE_URL}/api/admin/coordinators", headers=self.headers)
        coordinators = coord_res.json()
        
        if len(coordinators) == 0:
            coord_data = {
                "name": "TEST_LeadCoord",
                "email": f"leadcoord_{uuid.uuid4().hex[:6]}@fairystar.ae",
                "phone": "+971501234567"
            }
            create_res = requests.post(f"{BASE_URL}/api/admin/coordinators", 
                                      json=coord_data, headers=self.headers)
            coordinator_id = create_res.json()["coordinator"]["id"]
        else:
            coordinator_id = coordinators[0]["id"]
        
        # Create a lead
        lead_data = {
            "lead_type": "guest",
            "name": f"TEST_AssignLead_{uuid.uuid4().hex[:6]}",
            "email": f"assignlead_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "+971501234567"
        }
        create_res = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        lead_id = create_res.json()["id"]
        
        # Assign coordinator
        response = requests.put(f"{BASE_URL}/api/admin/leads/{lead_id}", 
                               json={"coordinator_id": coordinator_id}, 
                               headers=self.headers)
        assert response.status_code == 200, f"Assignment failed: {response.text}"
        
        # Verify assignment
        updated_lead = response.json()
        assert updated_lead["coordinator_id"] == coordinator_id
        
        print(f"✓ Assigned coordinator to lead: {lead_id}")


class TestServiceRequests:
    """Service requests tracking tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_services(self):
        """Test listing available services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} services")
    
    def test_list_service_requests(self):
        """Test listing service requests"""
        response = requests.get(f"{BASE_URL}/api/admin/service-requests", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} service requests")
    
    def test_create_service_request(self):
        """Test creating a service request"""
        request_data = {
            "service_type": "tour",
            "service_name": "Dubai City Tour",
            "guest_name": f"TEST_Guest_{uuid.uuid4().hex[:6]}",
            "guest_email": f"guest_{uuid.uuid4().hex[:6]}@example.com",
            "guest_phone": "+971501234567",
            "details": "Test service request"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/service-requests", 
                                json=request_data, headers=self.headers)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "request" in data
        
        print(f"✓ Created service request: {data['request']['id']}")
        return data['request']['id']
    
    def test_update_service_request_status(self):
        """Test updating service request status"""
        # Create a request first
        request_data = {
            "service_type": "car_rental",
            "service_name": "Economy Car Rental",
            "guest_name": "TEST_StatusGuest",
            "guest_email": f"statusguest_{uuid.uuid4().hex[:6]}@example.com",
            "guest_phone": "+971501234567"
        }
        create_res = requests.post(f"{BASE_URL}/api/admin/service-requests", 
                                  json=request_data, headers=self.headers)
        request_id = create_res.json()["request"]["id"]
        
        # Update status
        response = requests.put(f"{BASE_URL}/api/admin/service-requests/{request_id}", 
                               json={"status": "quoted", "quoted_price": 150.0}, 
                               headers=self.headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        print(f"✓ Updated service request status: {request_id}")


class TestAuditLogging:
    """Audit logging tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_audit_logs(self):
        """Test retrieving audit logs"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} audit logs")
    
    def test_audit_log_created_on_property_create(self):
        """Test that audit log is created when property is created"""
        # Create a property
        test_property = {
            "title": f"TEST_AuditProp_{uuid.uuid4().hex[:8]}",
            "description": "Property for audit test",
            "property_type": "holiday_home",
            "city": "Dubai",
            "address": "Audit Test Street",
            "bedrooms": 1,
            "bathrooms": 1,
            "max_guests": 2,
            "pricing": {
                "nightly": 200,
                "monthly": 4000,
                "cleaning_fee": 50,
                "service_fee_percent": 10,
                "taxes_percent": 5,
                "minimum_nights": 1,
                "maximum_nights": 365
            },
            "status": "draft"
        }
        
        create_res = requests.post(f"{BASE_URL}/api/admin/properties", 
                                  json=test_property, headers=self.headers)
        prop_id = create_res.json()["id"]
        
        # Check audit logs
        logs_res = requests.get(f"{BASE_URL}/api/admin/audit-logs?entity_type=property", 
                               headers=self.headers)
        logs = logs_res.json()
        
        # Find log for our property
        prop_logs = [l for l in logs if l["entity_id"] == prop_id]
        assert len(prop_logs) > 0, "No audit log found for created property"
        assert prop_logs[0]["action"] == "create"
        
        print(f"✓ Audit log created for property: {prop_id}")


class TestRBAC:
    """Role-Based Access Control tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_can_access_all_endpoints(self):
        """Test that admin role can access all endpoints"""
        # Admin stats
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200
        
        # Properties
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        
        # Bookings
        response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        assert response.status_code == 200
        
        # Leads
        response = requests.get(f"{BASE_URL}/api/admin/leads", headers=self.headers)
        assert response.status_code == 200
        
        # Coordinators
        response = requests.get(f"{BASE_URL}/api/admin/coordinators", headers=self.headers)
        assert response.status_code == 200
        
        # Audit logs
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs", headers=self.headers)
        assert response.status_code == 200
        
        print("✓ Admin role has access to all endpoints")
    
    def test_admin_users_list(self):
        """Test listing admin users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify password_hash is not exposed
        for user in data:
            assert "password_hash" not in user, "Password hash should not be exposed"
        
        print(f"✓ Listed {len(data)} admin users (password hashes hidden)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
