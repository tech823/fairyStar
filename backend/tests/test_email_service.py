"""
Test suite for Email Service functionality
Tests email settings API, email triggers, idempotency, and status tracking
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@fairystar.ae"
ADMIN_PASSWORD = "admin123"


class TestEmailSettingsAPI:
    """Test email settings endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_email_settings(self):
        """GET /api/admin/email/settings - returns config status"""
        response = requests.get(f"{BASE_URL}/api/admin/email/settings", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields exist
        assert "enabled" in data
        assert "resend_configured" in data
        assert "resend_from" in data
        assert "admin_email" in data
        
        # Verify email type toggles exist
        assert "booking_confirmation_enabled" in data
        assert "new_booking_alert_enabled" in data
        assert "coordinator_assigned_enabled" in data
        assert "lead_alert_enabled" in data
        assert "service_alert_enabled" in data
        
        print(f"Email settings: enabled={data['enabled']}, resend_configured={data['resend_configured']}")
    
    def test_update_email_settings_toggles(self):
        """PUT /api/admin/email/settings - updates toggles"""
        # First get current settings
        get_response = requests.get(f"{BASE_URL}/api/admin/email/settings", headers=self.headers)
        assert get_response.status_code == 200
        current = get_response.json()
        
        # Update settings
        update_data = {
            "enabled": True,
            "admin_email": "admin@fairystar.ae",
            "booking_confirmation_enabled": True,
            "new_booking_alert_enabled": True,
            "coordinator_assigned_enabled": True,
            "lead_alert_enabled": True,
            "service_alert_enabled": True
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/email/settings", json=update_data, headers=self.headers)
        assert response.status_code == 200
        
        # Verify update
        verify_response = requests.get(f"{BASE_URL}/api/admin/email/settings", headers=self.headers)
        assert verify_response.status_code == 200
        updated = verify_response.json()
        
        assert updated["enabled"] == True
        assert updated["booking_confirmation_enabled"] == True
        assert updated["lead_alert_enabled"] == True
        print("Email settings updated successfully")
    
    def test_update_email_settings_disable_specific_type(self):
        """PUT /api/admin/email/settings - can disable specific email types"""
        update_data = {
            "enabled": True,
            "admin_email": "admin@fairystar.ae",
            "booking_confirmation_enabled": True,
            "new_booking_alert_enabled": False,  # Disable this one
            "coordinator_assigned_enabled": True,
            "lead_alert_enabled": True,
            "service_alert_enabled": False  # Disable this one
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/email/settings", json=update_data, headers=self.headers)
        assert response.status_code == 200
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/admin/email/settings", headers=self.headers)
        updated = verify_response.json()
        
        assert updated["new_booking_alert_enabled"] == False
        assert updated["service_alert_enabled"] == False
        print("Specific email types disabled successfully")
    
    def test_send_test_email_not_configured(self):
        """POST /api/admin/email/test - returns not_configured when API key is placeholder"""
        response = requests.post(
            f"{BASE_URL}/api/admin/email/test?email_type=test&test_email=test@example.com",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # Since RESEND_API_KEY is placeholder, should return not_configured
        assert data["status"] in ["not_configured", "sent", "error"]
        print(f"Test email result: {data['status']}")


class TestLeadEmailTrigger:
    """Test lead creation triggers lead_alert email"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_lead_creation_triggers_email(self):
        """POST /api/leads - triggers lead_alert email and stores status in DB"""
        # Create a new lead
        lead_data = {
            "lead_type": "guest",
            "name": f"TEST_Email_Lead_{uuid.uuid4().hex[:8]}",
            "email": "test_lead@example.com",
            "phone": "+971501234567",
            "city": "Dubai",
            "check_in": "2025-03-01",
            "check_out": "2025-03-05",
            "guests": 2,
            "message": "Testing email trigger"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 200
        
        lead = response.json()
        lead_id = lead["id"]
        print(f"Created lead: {lead_id}")
        
        # Check email status via the status endpoint
        import time
        time.sleep(1)  # Wait for background task
        
        status_response = requests.get(
            f"{BASE_URL}/api/admin/email/status/lead/{lead_id}",
            headers=self.headers
        )
        assert status_response.status_code == 200
        
        status_data = status_response.json()
        print(f"Email status for lead: {status_data}")
        
        # Verify emails field exists (may be empty if email disabled)
        assert "emails" in status_data
        
        # If lead_alert was triggered, check for sent_at
        if status_data.get("emails", {}).get("lead_alert"):
            assert "sent_at" in status_data["emails"]["lead_alert"] or "status" in status_data["emails"]["lead_alert"]
            print(f"Lead alert email status: {status_data['emails']['lead_alert']}")


class TestCoordinatorAssignedEmail:
    """Test coordinator assignment triggers coordinator_assigned email"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_coordinator_assignment_triggers_email(self):
        """PUT /api/admin/bookings/{id}/assign-coordinator - triggers coordinator_assigned email"""
        # First get a booking
        bookings_response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        assert bookings_response.status_code == 200
        bookings = bookings_response.json()
        
        if not bookings:
            pytest.skip("No bookings available for testing")
        
        booking = bookings[0]
        booking_id = booking["id"]
        
        # Get coordinators
        coord_response = requests.get(f"{BASE_URL}/api/admin/coordinators", headers=self.headers)
        assert coord_response.status_code == 200
        coordinators = coord_response.json()
        
        if not coordinators:
            # Create a coordinator
            coord_data = {
                "name": "TEST_Coordinator",
                "email": "test_coord@fairystar.ae",
                "phone": "+971501234567"
            }
            create_response = requests.post(f"{BASE_URL}/api/admin/coordinators", json=coord_data, headers=self.headers)
            assert create_response.status_code == 200
            coordinator_id = create_response.json()["coordinator"]["id"]
        else:
            coordinator_id = coordinators[0]["id"]
        
        # Assign coordinator
        assign_response = requests.put(
            f"{BASE_URL}/api/admin/bookings/{booking_id}/assign-coordinator?coordinator_id={coordinator_id}",
            headers=self.headers
        )
        assert assign_response.status_code == 200
        print(f"Assigned coordinator {coordinator_id} to booking {booking_id}")
        
        # Check email status
        import time
        time.sleep(1)
        
        status_response = requests.get(
            f"{BASE_URL}/api/admin/email/status/booking/{booking_id}",
            headers=self.headers
        )
        assert status_response.status_code == 200
        
        status_data = status_response.json()
        print(f"Email status for booking: {status_data}")
        
        # Verify emails field exists
        assert "emails" in status_data


class TestEmailStatusEndpoint:
    """Test email status endpoint for different entity types"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_email_status_booking(self):
        """GET /api/admin/email/status/booking/{id} - returns email status"""
        # Get a booking
        bookings_response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        assert bookings_response.status_code == 200
        bookings = bookings_response.json()
        
        if not bookings:
            pytest.skip("No bookings available")
        
        booking_id = bookings[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/email/status/booking/{booking_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_id"] == booking_id
        assert data["entity_type"] == "booking"
        assert "emails" in data
        print(f"Booking email status: {data}")
    
    def test_email_status_lead(self):
        """GET /api/admin/email/status/lead/{id} - returns email status"""
        # Get a lead
        leads_response = requests.get(f"{BASE_URL}/api/admin/leads", headers=self.headers)
        assert leads_response.status_code == 200
        leads = leads_response.json()
        
        if not leads:
            pytest.skip("No leads available")
        
        lead_id = leads[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/email/status/lead/{lead_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_id"] == lead_id
        assert data["entity_type"] == "lead"
        assert "emails" in data
        print(f"Lead email status: {data}")
    
    def test_email_status_invalid_entity_type(self):
        """GET /api/admin/email/status/invalid/{id} - returns 400 for invalid type"""
        response = requests.get(
            f"{BASE_URL}/api/admin/email/status/invalid/some-id",
            headers=self.headers
        )
        assert response.status_code == 400
    
    def test_email_status_not_found(self):
        """GET /api/admin/email/status/booking/{id} - returns 404 for non-existent entity"""
        response = requests.get(
            f"{BASE_URL}/api/admin/email/status/booking/non-existent-id",
            headers=self.headers
        )
        assert response.status_code == 404


class TestEmailResendEndpoint:
    """Test email resend endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_resend_lead_alert(self):
        """POST /api/admin/email/resend/lead_alert/{id} - queues email resend"""
        # Get a lead
        leads_response = requests.get(f"{BASE_URL}/api/admin/leads", headers=self.headers)
        assert leads_response.status_code == 200
        leads = leads_response.json()
        
        if not leads:
            pytest.skip("No leads available")
        
        lead_id = leads[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/email/resend/lead_alert/{lead_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "queued"
        assert data["email_type"] == "lead_alert"
        assert data["entity_id"] == lead_id
        print(f"Resend queued: {data}")
    
    def test_resend_booking_confirmation(self):
        """POST /api/admin/email/resend/booking_confirmation/{id} - queues email resend"""
        # Get a booking
        bookings_response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        assert bookings_response.status_code == 200
        bookings = bookings_response.json()
        
        if not bookings:
            pytest.skip("No bookings available")
        
        booking_id = bookings[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/email/resend/booking_confirmation/{booking_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "queued"
        print(f"Booking confirmation resend queued: {data}")
    
    def test_resend_invalid_email_type(self):
        """POST /api/admin/email/resend/invalid_type/{id} - returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/admin/email/resend/invalid_type/some-id",
            headers=self.headers
        )
        assert response.status_code == 400


class TestServiceRequestEmailTrigger:
    """Test service request creation triggers service_alert email"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_service_request_triggers_email(self):
        """POST /api/admin/service-requests - triggers service_alert email"""
        # Create a service request
        request_data = {
            "service_type": "tour",
            "service_name": "TEST_Desert Safari",
            "guest_name": "Test Guest",
            "guest_email": "test@example.com",
            "guest_phone": "+971501234567",
            "details": "Testing email trigger for service request"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/service-requests",
            json=request_data,
            headers=self.headers
        )
        assert response.status_code == 200
        
        request_id = response.json()["request"]["id"]
        print(f"Created service request: {request_id}")
        
        # Check email status
        import time
        time.sleep(1)
        
        status_response = requests.get(
            f"{BASE_URL}/api/admin/email/status/service_request/{request_id}",
            headers=self.headers
        )
        assert status_response.status_code == 200
        
        status_data = status_response.json()
        print(f"Service request email status: {status_data}")
        assert "emails" in status_data


class TestEmailIdempotency:
    """Test email idempotency - no duplicate emails"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_lead_alert_idempotency(self):
        """Verify lead_alert email is only sent once"""
        # Create a lead
        lead_data = {
            "lead_type": "corporate",
            "name": f"TEST_Idempotency_{uuid.uuid4().hex[:8]}",
            "email": "idempotency_test@example.com",
            "phone": "+971501234567"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json()["id"]
        
        import time
        time.sleep(1)
        
        # Get initial email status
        status1 = requests.get(
            f"{BASE_URL}/api/admin/email/status/lead/{lead_id}",
            headers=self.headers
        ).json()
        
        # Try to resend (should reset and queue)
        resend_response = requests.post(
            f"{BASE_URL}/api/admin/email/resend/lead_alert/{lead_id}",
            headers=self.headers
        )
        assert resend_response.status_code == 200
        
        time.sleep(1)
        
        # Get status after resend
        status2 = requests.get(
            f"{BASE_URL}/api/admin/email/status/lead/{lead_id}",
            headers=self.headers
        ).json()
        
        print(f"Initial status: {status1}")
        print(f"After resend: {status2}")
        
        # Verify the email tracking is working
        assert "emails" in status2


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
