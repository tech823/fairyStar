#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Fairy Star Vacation Homes
Tests all API endpoints including auth, properties, bookings, leads, and payments
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class FairyStarAPITester:
    def __init__(self, base_url="https://star-booking-ui.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_result(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_seed_data(self):
        """Test seeding initial data"""
        return self.run_test("Seed Data", "POST", "seed", 200)

    def test_admin_registration(self):
        """Test admin registration (should fail if already exists)"""
        data = {
            "email": "test_admin@fairystar.ae",
            "password": "testpass123",
            "name": "Test Admin"
        }
        # This might return 400 if admin already exists, which is fine
        result = self.run_test("Admin Registration", "POST", "auth/register", 200, data)
        if not result:
            # Try with different email
            data["email"] = f"test_admin_{datetime.now().strftime('%H%M%S')}@fairystar.ae"
            result = self.run_test("Admin Registration (Alt)", "POST", "auth/register", 200, data)
        return result

    def test_admin_login(self):
        """Test admin login with default credentials"""
        data = {
            "email": "admin@fairystar.ae",
            "password": "admin123"
        }
        result = self.run_test("Admin Login", "POST", "auth/login", 200, data)
        if result and 'token' in result:
            self.token = result['token']
            return True
        return False

    def test_admin_me(self):
        """Test getting current admin user"""
        if not self.token:
            self.log_result("Admin Me", False, "No token available")
            return False
        return self.run_test("Admin Me", "GET", "auth/me", 200)

    def test_properties_list(self):
        """Test getting properties list"""
        return self.run_test("Properties List", "GET", "properties", 200)

    def test_properties_filters(self):
        """Test properties with filters"""
        filters = [
            ("city=Dubai", "Properties by City"),
            ("featured=true", "Featured Properties"),
            ("property_type=villa_resort", "Properties by Type"),
            ("guests=4", "Properties by Guests")
        ]
        
        results = []
        for filter_param, test_name in filters:
            result = self.run_test(test_name, "GET", f"properties?{filter_param}", 200)
            results.append(result is not None)
        
        return all(results)

    def test_property_detail(self):
        """Test getting a specific property"""
        # First get properties list to get an ID
        props = self.run_test("Get Properties for Detail Test", "GET", "properties", 200)
        if props and len(props) > 0:
            prop_id = props[0]['id']
            return self.run_test("Property Detail", "GET", f"properties/{prop_id}", 200)
        else:
            self.log_result("Property Detail", False, "No properties available for testing")
            return False

    def test_services_list(self):
        """Test getting services list"""
        return self.run_test("Services List", "GET", "services", 200)

    def test_booking_calculation(self):
        """Test booking price calculation"""
        # Get a property first
        props = self.run_test("Get Properties for Booking Test", "GET", "properties", 200)
        if not props or len(props) == 0:
            self.log_result("Booking Calculation", False, "No properties available")
            return False
        
        prop_id = props[0]['id']
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        
        params = f"property_id={prop_id}&check_in={check_in}&check_out={check_out}&guests=2"
        return self.run_test("Booking Calculation", "POST", f"bookings/calculate?{params}", 200)

    def test_create_lead(self):
        """Test creating a lead"""
        data = {
            "lead_type": "guest",
            "name": "Test Guest",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+971501234567",
            "city": "Dubai",
            "check_in": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "check_out": (datetime.now() + timedelta(days=17)).strftime("%Y-%m-%d"),
            "guests": 2,
            "purpose": "leisure",
            "message": "Test lead from API testing"
        }
        return self.run_test("Create Lead", "POST", "leads", 200, data)

    def test_admin_stats(self):
        """Test admin dashboard stats"""
        if not self.token:
            self.log_result("Admin Stats", False, "No admin token")
            return False
        return self.run_test("Admin Stats", "GET", "admin/stats", 200)

    def test_leads_list(self):
        """Test getting leads list (admin only)"""
        if not self.token:
            self.log_result("Leads List", False, "No admin token")
            return False
        return self.run_test("Leads List", "GET", "leads", 200)

    def test_bookings_list(self):
        """Test getting bookings list (admin only)"""
        if not self.token:
            self.log_result("Bookings List", False, "No admin token")
            return False
        return self.run_test("Bookings List", "GET", "bookings", 200)

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Fairy Star Vacation Homes API Tests")
        print("=" * 60)
        
        # Basic API tests
        self.test_root_endpoint()
        self.test_seed_data()
        
        # Auth tests
        self.test_admin_registration()
        login_success = self.test_admin_login()
        if login_success:
            self.test_admin_me()
        
        # Public API tests
        self.test_properties_list()
        self.test_properties_filters()
        self.test_property_detail()
        self.test_services_list()
        self.test_booking_calculation()
        self.test_create_lead()
        
        # Admin API tests
        if login_success:
            self.test_admin_stats()
            self.test_leads_list()
            self.test_bookings_list()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            failed_tests = [r for r in self.test_results if not r['success']]
            print(f"\nFailed tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
            return 1

def main():
    tester = FairyStarAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())