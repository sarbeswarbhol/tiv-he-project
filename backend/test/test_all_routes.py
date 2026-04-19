"""
test_all_routes.py - Comprehensive test suite for TIV-HE API

Run with: pytest test_all_routes.py -v
Or: python test_all_routes.py (if using unittest)

Prerequisites:
pip install pytest requests pytest-html (optional)
"""

import pytest
import requests
import json
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

# ============================================================
# Configuration
# ============================================================

import os

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
API_PREFIX = "/api/v1"

# Test user data
TEST_ADMIN = {
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
}

TEST_ISSUER = {
    "name": "Test Issuer",
    "username": "testissuer",
    "email": "issuer@example.com",
    "password": "issuer123",
    "role": "issuer"
}

TEST_HOLDER = {
    "name": "Test Holder",
    "username": "testholder",
    "email": "holder@example.com",
    "password": "holder123",
    "role": "holder"
}

TEST_VERIFIER = {
    "name": "Test Verifier",
    "username": "testverifier",
    "email": "verifier@example.com",
    "password": "verifier123",
    "role": "verifier"
}

# Test credential data
TEST_CREDENTIAL = {
    "basic": {
        "full_name": "John Doe",
        "gender": "male",
        "state": "California"
    },
    "attributes": {
        "age": 25,
        "citizenship_status": "citizen",
        "education_level": "bachelor",
        "marital_status": "single",
        "license_validity": True,
        "tax_compliance": True
    },
    "identifiers": {
        "aadhaar_number": "123456789012",
        "pan_number": "ABCDE1234F",
        "voter_id": "ABC1234567",
        "driving_license": "DL1234567890",
        "passport_number": "P12345678",
        "ration_card_number": "RC123456789"
    },
    "credential_type": "identity"
}


# ============================================================
# Data Classes for State Management
# ============================================================

@dataclass
class TestState:
    """Store test data across test sessions"""
    admin_token: str = None
    issuer_token: str = None
    holder_token: str = None
    verifier_token: str = None
    
    admin_id: str = None
    issuer_id: str = None
    holder_id: str = None
    verifier_id: str = None
    
    credential_id: str = None
    hash_id: str = None
    manual_id: str = None
    secure_token: str = None
    
    share_link: str = None
    share_data: str = None
    
    verification_log_id: int = None
    
    # Store user public_ids
    issuer_public_id: str = None
    holder_public_id: str = None
    verifier_public_id: str = None
    
    # Store for rejected user test
    rejected_user_id: str = None


state = TestState()


# ============================================================
# Helper Functions
# ============================================================

def api_url(path: str) -> str:
    """Get full API URL"""
    return f"{BASE_URL}{API_PREFIX}{path}"


def log_response(method: str, url: str, response: requests.Response):
    """Log API response for debugging"""
    print(f"\n{'='*60}")
    print(f"{method} {url}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text[:500]}")
    print(f"{'='*60}\n")


def assert_response(response: requests.Response, expected_status: int, 
                    expected_keys: list = None, error_msg: str = None):
    """Assert response status and optionally check keys"""
    if response.status_code != expected_status:
        print(f"Error: Expected {expected_status}, got {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Response: {response.text}")
    
    assert response.status_code == expected_status, error_msg or f"Expected {expected_status}, got {response.status_code}"
    
    if expected_keys and response.status_code < 400:
        data = response.json()
        for key in expected_keys:
            assert key in data, f"Key '{key}' not found in response"


def register_user(user_data: Dict) -> Dict:
    """Register a new user"""
    response = requests.post(api_url("/auth/register"), json=user_data)
    log_response("POST", "/auth/register", response)
    assert_response(response, 201, ["message", "user_id"])
    return response.json()


def login_user(email: str = None, username: str = None, password: str = None) -> Dict:
    """Login and get token"""
    login_data = {"password": password}
    if email:
        login_data["email"] = email
    elif username:
        login_data["username"] = username
    
    response = requests.post(api_url("/auth/login"), json=login_data)
    log_response("POST", "/auth/login", response)
    assert_response(response, 200, ["access_token", "user"])
    return response.json()


def get_headers(token: str) -> Dict:
    """Get authorization headers"""
    return {"Authorization": f"Bearer {token}"}


def approve_user(token: str, public_id: str):
    """Approve a user (admin only)"""
    response = requests.post(
        api_url(f"/admin/approve/{public_id}"),
        headers=get_headers(token)
    )
    log_response("POST", f"/admin/approve/{public_id}", response)
    return response


def get_user_public_id(token: str, email: str) -> Optional[str]:
    """Get user's public_id from /admin/users endpoint"""
    response = requests.get(
        api_url("/admin/users"),
        headers=get_headers(token)
    )
    if response.status_code == 200:
        users = response.json()
        for user in users:
            if user.get("email") == email:
                return user.get("public_id")
    return None


# ============================================================
# Test Class
# ============================================================

class TestTIVHEAPI:
    """Complete test suite for TIV-HE API"""
    
    # ============================================================
    # Setup and Teardown
    # ============================================================
    
    @classmethod
    def setup_class(cls):
        """Setup test environment - register and approve users"""
        print("\n" + "="*80)
        print("SETTING UP TEST ENVIRONMENT")
        print("="*80)
        
        # 1. Register users
        print("\n1. Registering users...")
        
        # Register Admin (if not exists, you might need to create admin manually)
        # For testing, we'll assume admin is already created and approved
        # You may need to create admin manually in database first
        print("   Note: Admin user should be created manually in database")
        
        # Register Issuer
        issuer_response = register_user(TEST_ISSUER)
        state.issuer_id = str(issuer_response["user_id"])
        print(f"   Issuer registered with ID: {state.issuer_id}")
        
        # Register Holder
        holder_response = register_user(TEST_HOLDER)
        state.holder_id = str(holder_response["user_id"])
        print(f"   Holder registered with ID: {state.holder_id}")
        
        # Register Verifier
        verifier_response = register_user(TEST_VERIFIER)
        state.verifier_id = str(verifier_response["user_id"])
        print(f"   Verifier registered with ID: {state.verifier_id}")
        
        # 2. Login as admin and approve users
        # You need to login as admin - provide credentials
        print("\n2. Logging in as admin...")
        print("   ⚠️  Please provide admin credentials:")
        admin_email = input("   Admin email (default: admin@example.com): ").strip() or "admin@example.com"
        admin_password = input("   Admin password: ").strip()
        
        try:
            admin_login = login_user(email=admin_email, password=admin_password)
            state.admin_token = admin_login["access_token"]
            state.admin_id = str(admin_login["user"]["id"])
            print(f"   Admin logged in with ID: {state.admin_id}")
        except Exception as e:
            print(f"   ❌ Failed to login as admin: {e}")
            print("   Please ensure admin user exists and is approved")
            raise
        
        # 3. Get public_ids and approve users
        print("\n3. Getting public_ids and approving users...")
        
        # Get all users
        response = requests.get(
            api_url("/admin/users"),
            headers=get_headers(state.admin_token)
        )
        
        if response.status_code == 200:
            users = response.json()
            for user in users:
                email = user.get("email")
                public_id = user.get("public_id")
                
                if email == TEST_ISSUER["email"]:
                    state.issuer_public_id = public_id
                    approve_user(state.admin_token, public_id)
                    print(f"   ✅ Issuer approved (public_id: {public_id})")
                
                elif email == TEST_HOLDER["email"]:
                    state.holder_public_id = public_id
                    approve_user(state.admin_token, public_id)
                    print(f"   ✅ Holder approved (public_id: {public_id})")
                
                elif email == TEST_VERIFIER["email"]:
                    state.verifier_public_id = public_id
                    approve_user(state.admin_token, public_id)
                    print(f"   ✅ Verifier approved (public_id: {public_id})")
        
        # 4. Login as approved users
        print("\n4. Logging in as approved users...")
        
        issuer_login = login_user(email=TEST_ISSUER["email"], password=TEST_ISSUER["password"])
        state.issuer_token = issuer_login["access_token"]
        print(f"   ✅ Issuer logged in")
        
        holder_login = login_user(email=TEST_HOLDER["email"], password=TEST_HOLDER["password"])
        state.holder_token = holder_login["access_token"]
        print(f"   ✅ Holder logged in")
        
        verifier_login = login_user(email=TEST_VERIFIER["email"], password=TEST_VERIFIER["password"])
        state.verifier_token = verifier_login["access_token"]
        print(f"   ✅ Verifier logged in")
        
        print("\n" + "="*80)
        print("TEST SETUP COMPLETE")
        print("="*80 + "\n")
    
    @classmethod
    def teardown_class(cls):
        """Cleanup after tests"""
        print("\n" + "="*80)
        print("CLEANING UP")
        print("="*80)
        
        # Optionally delete test users
        if state.admin_token and state.holder_public_id:
            print("Deleting test users...")
            # Unapprove and delete users
            response = requests.post(
                api_url(f"/admin/unapprove/{state.holder_public_id}"),
                headers=get_headers(state.admin_token)
            )
            print(f"  Holder unapproved: {response.status_code}")
        
        print("Cleanup complete!")
    
    # ============================================================
    # Admin Routes Tests
    # ============================================================
    
    def test_01_admin_list_users(self):
        """Test GET /admin/users - List all non-admin users"""
        print("\n--- Test: List non-admin users ---")
        
        response = requests.get(
            api_url("/admin/users?skip=0&limit=50"),
            headers=get_headers(state.admin_token)
        )
        log_response("GET", "/admin/users", response)
        assert_response(response, 200)
        
        users = response.json()
        assert isinstance(users, list)
        
        # Verify no admin in list
        for user in users:
            assert user["role"] != "admin"
        
        print(f"✅ Found {len(users)} non-admin users")
    
    def test_02_admin_list_admins(self):
        """Test GET /admin/admins - List all admin users"""
        print("\n--- Test: List admin users ---")
        
        response = requests.get(
            api_url("/admin/admins"),
            headers=get_headers(state.admin_token)
        )
        log_response("GET", "/admin/admins", response)
        assert_response(response, 200)
        
        admins = response.json()
        assert isinstance(admins, list)
        
        for admin in admins:
            assert admin["role"] == "admin"
        
        print(f"✅ Found {len(admins)} admin users")
    
    def test_03_admin_approve_user(self):
        """Test POST /admin/approve/{public_id} - Approve a user"""
        print("\n--- Test: Approve user (should be already approved) ---")
        
        # Try to approve already approved user
        response = approve_user(state.admin_token, state.holder_public_id)
        assert response.status_code == 200
        assert "already approved" in response.json().get("message", "")
        
        print("✅ User already approved test passed")
    
    def test_04_admin_reject_user(self):
        """Test POST /admin/reject/{public_id} - Reject a user"""
        print("\n--- Test: Reject a user ---")
        
        # First create a new user to reject
        test_user = {
            "name": "To Reject",
            "username": "toreject",
            "email": "reject@example.com",
            "password": "reject123",
            "role": "holder"
        }
        
        register_response = register_user(test_user)
        user_id = register_response["user_id"]
        
        # Get public_id
        response = requests.get(
            api_url("/admin/users"),
            headers=get_headers(state.admin_token)
        )
        users = response.json()
        public_id = None
        for user in users:
            if user.get("email") == "reject@example.com":
                public_id = user.get("public_id")
                break
        
        if public_id:
            # Reject the user
            response = requests.post(
                api_url(f"/admin/reject/{public_id}"),
                headers=get_headers(state.admin_token)
            )
            log_response("POST", f"/admin/reject/{public_id}", response)
            assert_response(response, 200)
            assert "removed" in response.json().get("message", "")
            print("✅ User rejected successfully")
            
            # Store for later
            state.rejected_user_id = public_id
    
    def test_05_admin_unapprove_user(self):
        """Test POST /admin/unapprove/{public_id} - Unapprove a user"""
        print("\n--- Test: Unapprove a user ---")
        
        response = requests.post(
            api_url(f"/admin/unapprove/{state.holder_public_id}"),
            headers=get_headers(state.admin_token)
        )
        log_response("POST", f"/admin/unapprove/{state.holder_public_id}", response)
        assert_response(response, 200)
        assert "unapproved" in response.json().get("message", "")
        
        print("✅ User unapproved successfully")
        
        # Re-approve for other tests
        time.sleep(1)
        approve_user(state.admin_token, state.holder_public_id)
        print("   User re-approved for further tests")
    
    def test_06_admin_blockchain_state(self):
        """Test GET /admin/blockchain - Get blockchain state"""
        print("\n--- Test: Get blockchain state ---")
        
        response = requests.get(
            api_url("/admin/blockchain"),
            headers=get_headers(state.admin_token)
        )
        log_response("GET", "/admin/blockchain", response)
        assert_response(response, 200, ["trusted_issuers", "issued_hashes", "revoked_hashes"])
        
        print(f"✅ Blockchain state retrieved")
    
    def test_07_admin_add_issuer_blockchain(self):
        """Test POST /admin/blockchain/add-issuer/{public_id} - Add issuer to blockchain"""
        print("\n--- Test: Add issuer to blockchain ---")
        
        response = requests.post(
            api_url(f"/admin/blockchain/add-issuer/{state.issuer_public_id}"),
            headers=get_headers(state.admin_token)
        )
        log_response("POST", f"/admin/blockchain/add-issuer/{state.issuer_public_id}", response)
        assert_response(response, 200)
        assert "added" in response.json().get("message", "").lower()
        
        print("✅ Issuer added to blockchain")
    
    def test_08_admin_remove_issuer_blockchain(self):
        """Test POST /admin/blockchain/remove-issuer/{public_id} - Remove issuer from blockchain"""
        print("\n--- Test: Remove issuer from blockchain ---")
        
        response = requests.post(
            api_url(f"/admin/blockchain/remove-issuer/{state.issuer_public_id}"),
            headers=get_headers(state.admin_token)
        )
        log_response("POST", f"/admin/blockchain/remove-issuer/{state.issuer_public_id}", response)
        assert_response(response, 200)
        assert "removed" in response.json().get("message", "").lower()
        
        # Re-add for credential issuance
        time.sleep(1)
        requests.post(
            api_url(f"/admin/blockchain/add-issuer/{state.issuer_public_id}"),
            headers=get_headers(state.admin_token)
        )
        print("✅ Issuer removed and re-added from blockchain")
    
    # ============================================================
    # Issuer Routes Tests
    # ============================================================
    
    def test_09_issuer_issue_credential(self):
        """Test POST /issuer/issue - Issue a credential"""
        print("\n--- Test: Issue credential ---")
        
        credential_data = TEST_CREDENTIAL.copy()
        credential_data["holder_id"] = state.holder_public_id
        
        response = requests.post(
            api_url("/issuer/issue"),
            headers=get_headers(state.issuer_token),
            json=credential_data
        )
        log_response("POST", "/issuer/issue", response)
        assert_response(response, 201, ["credential_id", "hash_id", "holder_id", "expires_at"])
        
        state.credential_id = response.json()["credential_id"]
        state.hash_id = response.json()["hash_id"]
        
        print(f"✅ Credential issued: {state.credential_id}")
    
    def test_10_issuer_list_credentials(self):
        """Test GET /issuer/credentials - List issued credentials"""
        print("\n--- Test: List issuer's credentials ---")
        
        response = requests.get(
            api_url("/issuer/credentials"),
            headers=get_headers(state.issuer_token)
        )
        log_response("GET", "/issuer/credentials", response)
        assert_response(response, 200)
        
        credentials = response.json()
        assert isinstance(credentials, list)
        
        if credentials:
            assert "credential_id" in credentials[0]
            assert "hash_id" in credentials[0]
        
        print(f"✅ Found {len(credentials)} issued credentials")
    
    def test_11_issuer_get_credential(self):
        """Test GET /issuer/credentials/{credential_id} - Get single credential"""
        print("\n--- Test: Get specific credential ---")
        
        response = requests.get(
            api_url(f"/issuer/credentials/{state.credential_id}"),
            headers=get_headers(state.issuer_token)
        )
        log_response("GET", f"/issuer/credentials/{state.credential_id}", response)
        assert_response(response, 200, ["credential_id", "hash_id", "holder_id"])
        
        cred = response.json()
        assert cred["credential_id"] == state.credential_id
        
        print(f"✅ Credential retrieved")
    
    def test_12_issuer_revoke_credential(self):
        """Test POST /issuer/revoke/{credential_id} - Revoke credential"""
        print("\n--- Test: Revoke credential ---")
        
        response = requests.post(
            api_url(f"/issuer/revoke/{state.credential_id}"),
            headers=get_headers(state.issuer_token)
        )
        log_response("POST", f"/issuer/revoke/{state.credential_id}", response)
        assert_response(response, 200)
        assert "revoked" in response.json().get("message", "").lower()
        
        print("✅ Credential revoked")
        
        # Note: In a real implementation, you might want to issue a new credential for verification tests
    
    # ============================================================
    # Holder Routes Tests
    # ============================================================
    
    def test_13_holder_my_profile(self):
        """Test GET /holder/me - Get holder profile"""
        print("\n--- Test: Get holder profile ---")
        
        response = requests.get(
            api_url("/holder/me"),
            headers=get_headers(state.holder_token)
        )
        log_response("GET", "/holder/me", response)
        assert_response(response, 200, ["id", "public_id", "email", "role"])
        
        assert response.json()["role"] == "holder"
        
        print("✅ Holder profile retrieved")
    
    def test_14_holder_list_credentials(self):
        """Test GET /holder/credentials - List holder's credentials"""
        print("\n--- Test: List holder's credentials ---")
        
        response = requests.get(
            api_url("/holder/credentials"),
            headers=get_headers(state.holder_token)
        )
        log_response("GET", "/holder/credentials", response)
        assert_response(response, 200)
        
        credentials = response.json()
        assert isinstance(credentials, list)
        
        print(f"✅ Found {len(credentials)} credentials")
    
    def test_15_holder_get_credential(self):
        """Test GET /holder/credentials/{credential_id} - Get single credential"""
        print("\n--- Test: Get specific credential ---")
        
        # First get list to find credential_id
        response = requests.get(
            api_url("/holder/credentials"),
            headers=get_headers(state.holder_token)
        )
        credentials = response.json()
        
        if credentials:
            cred_id = credentials[0]["credential_id"]
            
            response = requests.get(
                api_url(f"/holder/credentials/{cred_id}"),
                headers=get_headers(state.holder_token)
            )
            log_response("GET", f"/holder/credentials/{cred_id}", response)
            assert_response(response, 200, ["credential_id", "hash_id"])
            
            print(f"✅ Credential retrieved: {cred_id}")
        else:
            print("⚠️ No credentials to retrieve")
    
    def test_16_holder_refresh_token(self):
        """Test POST /holder/credentials/{credential_id}/refresh - Refresh token"""
        print("\n--- Test: Refresh credential token ---")
        
        # Get a credential first
        response = requests.get(
            api_url("/holder/credentials"),
            headers=get_headers(state.holder_token)
        )
        credentials = response.json()
        
        if credentials:
            cred_id = credentials[0]["credential_id"]
            
            response = requests.post(
                api_url(f"/holder/credentials/{cred_id}/refresh"),
                headers=get_headers(state.holder_token)
            )
            log_response("POST", f"/holder/credentials/{cred_id}/refresh", response)
            
            if response.status_code == 200:
                data = response.json()
                if "secure_token" in data:
                    state.secure_token = data["secure_token"]
                if "manual_id" in data:
                    state.manual_id = data["manual_id"]
                print(f"✅ Token refreshed - manual_id: {state.manual_id}")
            else:
                print(f"⚠️ Refresh returned status: {response.status_code}")
        else:
            print("⚠️ No credentials to refresh token")
    
    def test_17_holder_create_share_link(self):
        """Test POST /holder/credentials/{credential_id}/share-link - Create share link"""
        print("\n--- Test: Create share link ---")
        
        response = requests.get(
            api_url("/holder/credentials"),
            headers=get_headers(state.holder_token)
        )
        credentials = response.json()
        
        if credentials:
            cred_id = credentials[0]["credential_id"]
            
            share_request = {
                "fields": ["full_name", "age", "education_level"],
                "condition": "age >= 18"
            }
            
            response = requests.post(
                api_url(f"/holder/credentials/{cred_id}/share-link"),
                headers=get_headers(state.holder_token),
                json=share_request
            )
            log_response("POST", f"/holder/credentials/{cred_id}/share-link", response)
            
            if response.status_code == 200:
                data = response.json()
                assert "verification_link" in data
                state.share_link = data["verification_link"]
                print(f"✅ Share link created: {state.share_link[:100]}...")
            else:
                print(f"⚠️ Share link creation returned: {response.status_code}")
        else:
            print("⚠️ No credentials to create share link")
    
    def test_18_holder_verification_logs(self):
        """Test GET /holder/logs - Get holder's verification logs"""
        print("\n--- Test: Get holder verification logs ---")
        
        response = requests.get(
            api_url("/holder/logs"),
            headers=get_headers(state.holder_token)
        )
        log_response("GET", "/holder/logs", response)
        assert_response(response, 200)
        
        logs = response.json()
        assert isinstance(logs, list)
        
        print(f"✅ Found {len(logs)} verification logs")
    
    # ============================================================
    # Verifier Routes Tests
    # ============================================================
    
    def test_19_verifier_verify_manual_id(self):
        """Test POST /verifier/verify - Verify with manual_id"""
        print("\n--- Test: Verify with manual_id ---")
        
        if not state.manual_id:
            # Try to get a credential and its manual_id
            response = requests.get(
                api_url("/holder/credentials"),
                headers=get_headers(state.holder_token)
            )
            credentials = response.json()
            
            if credentials:
                # For testing, we need to get manual_id from token refresh
                cred_id = credentials[0]["credential_id"]
                refresh_response = requests.post(
                    api_url(f"/holder/credentials/{cred_id}/refresh"),
                    headers=get_headers(state.holder_token)
                )
                if refresh_response.status_code == 200:
                    state.manual_id = refresh_response.json().get("manual_id")
        
        if state.manual_id:
            verify_request = {
                "manual_id": state.manual_id
            }
            
            response = requests.post(
                api_url("/verifier/verify"),
                headers=get_headers(state.verifier_token),
                json=verify_request
            )
            log_response("POST", "/verifier/verify (manual_id)", response)
            
            if response.status_code == 200:
                data = response.json()
                assert "manual_id" in data
                assert "overall_result" in data
                print(f"✅ Verification result: {data['overall_result']}")
            else:
                print(f"⚠️ Verification returned: {response.status_code}")
        else:
            print("⚠️ No manual_id available for verification")
    
    def test_20_verifier_verify_secure_token(self):
        """Test POST /verifier/verify - Verify with secure_token"""
        print("\n--- Test: Verify with secure_token ---")
        
        if not state.secure_token:
            # Get a credential and refresh token
            response = requests.get(
                api_url("/holder/credentials"),
                headers=get_headers(state.holder_token)
            )
            credentials = response.json()
            
            if credentials:
                cred_id = credentials[0]["credential_id"]
                refresh_response = requests.post(
                    api_url(f"/holder/credentials/{cred_id}/refresh"),
                    headers=get_headers(state.holder_token)
                )
                if refresh_response.status_code == 200:
                    state.secure_token = refresh_response.json().get("secure_token")
        
        if state.secure_token:
            verify_request = {
                "secure_token": state.secure_token,
                "conditions": ["age >= 18", "tax_compliance == true"]
            }
            
            response = requests.post(
                api_url("/verifier/verify"),
                headers=get_headers(state.verifier_token),
                json=verify_request
            )
            log_response("POST", "/verifier/verify (secure_token)", response)
            
            if response.status_code == 200:
                data = response.json()
                assert "manual_id" in data
                assert "results" in data
                print(f"✅ Verification results: {len(data['results'])} conditions checked")
            else:
                print(f"⚠️ Verification returned: {response.status_code}")
        else:
            print("⚠️ No secure_token available for verification")
    
    def test_21_verifier_verify_link(self):
        """Test GET /verifier/verify-link - Verify via share link"""
        print("\n--- Test: Verify via share link ---")
        
        # First create a share link
        response = requests.get(
            api_url("/holder/credentials"),
            headers=get_headers(state.holder_token)
        )
        credentials = response.json()
        
        if credentials:
            cred_id = credentials[0]["credential_id"]
            
            share_request = {
                "fields": ["full_name", "age"],
                "condition": "age >= 21"
            }
            
            share_response = requests.post(
                api_url(f"/holder/credentials/{cred_id}/share-link"),
                headers=get_headers(state.holder_token),
                json=share_request
            )
            
            if share_response.status_code == 200:
                link = share_response.json().get("verification_link")
                
                # Extract token and data from link
                # Link format: /verifier/verify-link?token=xxx&data=yyy
                if "?token=" in link:
                    parts = link.split("?token=")[1]
                    token_parts = parts.split("&")
                    token = token_parts[0]
                    data = token_parts[1].split("=")[1] if len(token_parts) > 1 else None
                    
                    url = api_url(f"/verifier/verify-link?token={token}")
                    if data:
                        url += f"&data={data}"
                    
                    response = requests.get(
                        url,
                        headers=get_headers(state.verifier_token)
                    )
                    log_response("GET", "/verifier/verify-link", response)
                    
                    if response.status_code == 200:
                        print(f"✅ Link verification successful")
                    else:
                        print(f"⚠️ Link verification returned: {response.status_code}")
        else:
            print("⚠️ No credentials for share link test")
    
    def test_22_verifier_logs(self):
        """Test GET /verifier/logs - Get verifier's logs"""
        print("\n--- Test: Get verifier logs ---")
        
        response = requests.get(
            api_url("/verifier/logs"),
            headers=get_headers(state.verifier_token)
        )
        log_response("GET", "/verifier/logs", response)
        assert_response(response, 200)
        
        logs = response.json()
        assert isinstance(logs, list)
        
        print(f"✅ Found {len(logs)} verification logs")
    
    # ============================================================
    # Auth Routes Tests
    # ============================================================
    
    def test_23_auth_get_me(self):
        """Test GET /auth/me - Get current user info"""
        print("\n--- Test: Get current user ---")
        
        response = requests.get(
            api_url("/auth/me"),
            headers=get_headers(state.holder_token)
        )
        log_response("GET", "/auth/me", response)
        assert_response(response, 200, ["id", "email", "role"])
        
        print(f"✅ Current user: {response.json()['email']}")
    
    def test_24_auth_invalid_login(self):
        """Test POST /auth/login - Invalid credentials"""
        print("\n--- Test: Invalid login ---")
        
        response = requests.post(
            api_url("/auth/login"),
            json={"email": "nonexistent@example.com", "password": "wrong"}
        )
        
        assert response.status_code in [401, 403]
        print("✅ Invalid login rejected")
    
    def test_25_auth_duplicate_registration(self):
        """Test POST /auth/register - Duplicate registration"""
        print("\n--- Test: Duplicate registration ---")
        
        response = requests.post(
            api_url("/auth/register"),
            json=TEST_HOLDER
        )
        
        assert response.status_code == 409
        print("✅ Duplicate registration rejected")
    
    # ============================================================
    # Security/Access Control Tests
    # ============================================================
    
    def test_26_access_holder_as_issuer(self):
        """Test access control - Issuer trying to access holder endpoint"""
        print("\n--- Test: Issuer accessing holder endpoint (should fail) ---")
        
        response = requests.get(
            api_url("/holder/me"),
            headers=get_headers(state.issuer_token)
        )
        
        assert response.status_code == 403
        print("✅ Access denied as expected")
    
    def test_27_access_issuer_as_holder(self):
        """Test access control - Holder trying to access issuer endpoint"""
        print("\n--- Test: Holder accessing issuer endpoint (should fail) ---")
        
        response = requests.post(
            api_url("/issuer/issue"),
            headers=get_headers(state.holder_token),
            json=TEST_CREDENTIAL
        )
        
        assert response.status_code == 403
        print("✅ Access denied as expected")
    
    def test_28_access_admin_as_issuer(self):
        """Test access control - Issuer trying to access admin endpoint"""
        print("\n--- Test: Issuer accessing admin endpoint (should fail) ---")
        
        response = requests.get(
            api_url("/admin/users"),
            headers=get_headers(state.issuer_token)
        )
        
        assert response.status_code == 403
        print("✅ Access denied as expected")
    
    def test_29_missing_token(self):
        """Test access control - Request without token"""
        print("\n--- Test: Request without token (should fail) ---")
        
        response = requests.get(api_url("/holder/me"))
        
        assert response.status_code == 401
        print("✅ Unauthorized as expected")


# ============================================================
# Run Tests
# ============================================================

if __name__ == "__main__":
    print("\n" + "="*80)
    print("TIV-HE API TEST SUITE")
    print("="*80)
    print("\n⚠️  IMPORTANT NOTES:")
    print("1. Ensure the API server is running at " + BASE_URL)
    print("2. An admin user must exist in the database")
    print("3. The admin user should already be approved")
    print("\nPress Enter to continue...")
    input()
    
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short", "--disable-warnings"])