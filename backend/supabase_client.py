import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables.")

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

# --- Get user by email ---
async def get_user_by_email(email: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/users",
            headers=headers,
            params={"email": f"eq.{email}", "select": "*"}
        )
        response.raise_for_status()
        data = response.json()
        return data[0] if data else None

# --- Create a user ---
async def create_user(email: str, hashed_password: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/users",
            headers={**headers, "Prefer": "return=representation"},
            json={"email": email, "hashed_password": hashed_password}
        )
        try:
            response.raise_for_status()
            json_data = response.json()
            return json_data[0] if isinstance(json_data, list) and json_data else None
        except httpx.HTTPStatusError as http_err:
            print(f"[create_user] HTTP error: {http_err.response.status_code} - {http_err.response.text}")
            raise
        except Exception as e:
            print(f"[create_user] Unexpected error parsing JSON: {e}")
            raise

# --- Create subscription ---
async def create_subscription(data: dict):
    print("[create_subscription] Data being sent to Supabase:", data)
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/subscriptions",
                headers={**headers, "Prefer": "return=representation"},
                json=data
            )
            response.raise_for_status()
            json_data = response.json()
            return json_data[0] if isinstance(json_data, list) and json_data else None
        except httpx.HTTPStatusError as http_err:
            print(f"[create_subscription] HTTP error {http_err.response.status_code}: {http_err.response.text}")
            raise
        except Exception as e:
            print(f"[create_subscription] Unexpected error: {e}")
            raise

# --- Get subscriptions by owner_id ---
async def get_subscriptions_by_owner(owner_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/subscriptions",
            headers=headers,
            params={"owner_id": f"eq.{owner_id}", "select": "*"}
        )
        response.raise_for_status()
        return response.json()

# --- Delete subscription ---
async def delete_subscription(subscription_id: int):
    print(f"[delete_subscription] Deleting subscription with ID: {subscription_id}")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/subscriptions",
                headers=headers,
                params={"id": f"eq.{subscription_id}"}
            )
            response.raise_for_status()
            print(f"[delete_subscription] Successfully deleted subscription {subscription_id}")
            return True
        except httpx.HTTPStatusError as http_err:
            print(f"[delete_subscription] HTTP error {http_err.response.status_code}: {http_err.response.text}")
            raise
        except Exception as e:
            print(f"[delete_subscription] Unexpected error: {e}")
            raise
