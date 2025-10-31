import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, List, Dict, Any

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables.")

# Initialize Supabase client with service role key (bypasses RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ========== USER OPERATIONS ==========

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email address"""
    try:
        response = supabase.table("users").select("*").eq("email", email).maybeSingle().execute()
        return response.data
    except Exception as e:
        print(f"[get_user_by_email] Error: {e}")
        raise

async def create_user(email: str, hashed_password: str) -> Dict[str, Any]:
    """Create a new user"""
    try:
        response = supabase.table("users").insert({
            "email": email,
            "hashed_password": hashed_password
        }).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        raise Exception("Failed to create user - no data returned")
    except Exception as e:
        print(f"[create_user] Error: {e}")
        raise

async def update_user_last_login(user_id: int) -> bool:
    """Update user's last login timestamp"""
    try:
        from datetime import datetime
        response = supabase.table("users").update({
            "last_login": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()
        return True
    except Exception as e:
        print(f"[update_user_last_login] Error: {e}")
        return False

# ========== SUBSCRIPTION OPERATIONS ==========

async def create_subscription(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new subscription"""
    try:
        print(f"[create_subscription] Creating subscription with data: {data}")
        response = supabase.table("subscriptions").insert(data).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        raise Exception("Failed to create subscription - no data returned")
    except Exception as e:
        print(f"[create_subscription] Error: {e}")
        raise

async def get_subscriptions_by_owner(owner_id: int) -> List[Dict[str, Any]]:
    """Get all active subscriptions for a user"""
    try:
        response = supabase.table("subscriptions")\
            .select("*")\
            .eq("owner_id", owner_id)\
            .eq("is_active", True)\
            .order("created_at", desc=True)\
            .execute()
        return response.data or []
    except Exception as e:
        print(f"[get_subscriptions_by_owner] Error: {e}")
        raise

async def get_subscription_by_id(subscription_id: int, owner_id: int) -> Optional[Dict[str, Any]]:
    """Get a specific subscription by ID (with owner verification)"""
    try:
        response = supabase.table("subscriptions")\
            .select("*")\
            .eq("id", subscription_id)\
            .eq("owner_id", owner_id)\
            .maybeSingle()\
            .execute()
        return response.data
    except Exception as e:
        print(f"[get_subscription_by_id] Error: {e}")
        raise

async def update_subscription(subscription_id: int, owner_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """Update a subscription"""
    try:
        response = supabase.table("subscriptions")\
            .update(data)\
            .eq("id", subscription_id)\
            .eq("owner_id", owner_id)\
            .execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        raise Exception("Failed to update subscription")
    except Exception as e:
        print(f"[update_subscription] Error: {e}")
        raise

async def delete_subscription(subscription_id: int) -> bool:
    """Soft delete a subscription by setting is_active to False"""
    try:
        print(f"[delete_subscription] Soft deleting subscription {subscription_id}")
        response = supabase.table("subscriptions")\
            .update({"is_active": False})\
            .eq("id", subscription_id)\
            .execute()
        print(f"[delete_subscription] Successfully soft deleted subscription {subscription_id}")
        return True
    except Exception as e:
        print(f"[delete_subscription] Error: {e}")
        raise

# ========== MERCHANT CANCEL LINKS ==========

async def get_merchant_cancel_link(merchant_name: str) -> Optional[Dict[str, Any]]:
    """Get cancellation link for a merchant"""
    try:
        response = supabase.table("merchant_cancel_links")\
            .select("*")\
            .eq("merchant_name", merchant_name)\
            .eq("is_active", True)\
            .maybeSingle()\
            .execute()
        return response.data
    except Exception as e:
        print(f"[get_merchant_cancel_link] Error: {e}")
        return None

async def search_merchant_cancel_links(query: str) -> List[Dict[str, Any]]:
    """Search for merchant cancel links by name"""
    try:
        response = supabase.table("merchant_cancel_links")\
            .select("*")\
            .ilike("merchant_name", f"%{query}%")\
            .eq("is_active", True)\
            .limit(10)\
            .execute()
        return response.data or []
    except Exception as e:
        print(f"[search_merchant_cancel_links] Error: {e}")
        return []

# ========== ANALYTICS OPERATIONS ==========

async def log_analytics_event(
    user_id: int,
    event_type: str,
    subscription_id: Optional[int] = None,
    merchant_name: Optional[str] = None,
    event_data: Optional[Dict[str, Any]] = None,
    session_id: Optional[str] = None,
    platform: Optional[str] = None,
    app_version: Optional[str] = None
) -> bool:
    """Log an analytics event"""
    try:
        data = {
            "user_id": user_id,
            "event_type": event_type
        }

        if subscription_id:
            data["subscription_id"] = subscription_id
        if merchant_name:
            data["merchant_name"] = merchant_name
        if event_data:
            data["event_data"] = event_data
        if session_id:
            data["session_id"] = session_id
        if platform:
            data["platform"] = platform
        if app_version:
            data["app_version"] = app_version

        supabase.table("analytics_events").insert(data).execute()
        return True
    except Exception as e:
        print(f"[log_analytics_event] Error: {e}")
        return False

# ========== NOTIFICATION PREFERENCES ==========

async def get_user_notification_preferences(user_id: int) -> List[Dict[str, Any]]:
    """Get all notification preferences for a user"""
    try:
        response = supabase.table("notification_preferences")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()
        return response.data or []
    except Exception as e:
        print(f"[get_user_notification_preferences] Error: {e}")
        return []

async def update_notification_preference(
    user_id: int,
    notification_type: str,
    is_enabled: bool,
    subscription_id: Optional[int] = None
) -> bool:
    """Update or create a notification preference"""
    try:
        # Check if preference exists
        query = supabase.table("notification_preferences")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("notification_type", notification_type)

        if subscription_id:
            query = query.eq("subscription_id", subscription_id)
        else:
            query = query.is_("subscription_id", "null")

        existing = query.maybeSingle().execute()

        data = {
            "user_id": user_id,
            "notification_type": notification_type,
            "is_enabled": is_enabled
        }

        if subscription_id:
            data["subscription_id"] = subscription_id

        if existing.data:
            # Update existing
            supabase.table("notification_preferences")\
                .update({"is_enabled": is_enabled})\
                .eq("id", existing.data["id"])\
                .execute()
        else:
            # Create new
            supabase.table("notification_preferences").insert(data).execute()

        return True
    except Exception as e:
        print(f"[update_notification_preference] Error: {e}")
        return False

# ========== PUSH TOKENS ==========

async def register_push_token(
    user_id: int,
    expo_push_token: str,
    platform: str,
    device_id: Optional[str] = None,
    device_name: Optional[str] = None,
    os_version: Optional[str] = None,
    app_version: Optional[str] = None
) -> bool:
    """Register or update a push notification token"""
    try:
        # Check if token already exists
        existing = supabase.table("push_tokens")\
            .select("*")\
            .eq("expo_push_token", expo_push_token)\
            .maybeSingle()\
            .execute()

        data = {
            "user_id": user_id,
            "expo_push_token": expo_push_token,
            "platform": platform,
            "is_active": True
        }

        if device_id:
            data["device_id"] = device_id
        if device_name:
            data["device_name"] = device_name
        if os_version:
            data["os_version"] = os_version
        if app_version:
            data["app_version"] = app_version

        if existing.data:
            # Update existing token
            supabase.table("push_tokens")\
                .update(data)\
                .eq("id", existing.data["id"])\
                .execute()
        else:
            # Insert new token
            supabase.table("push_tokens").insert(data).execute()

        return True
    except Exception as e:
        print(f"[register_push_token] Error: {e}")
        return False

async def get_user_push_tokens(user_id: int) -> List[str]:
    """Get all active push tokens for a user"""
    try:
        response = supabase.table("push_tokens")\
            .select("expo_push_token")\
            .eq("user_id", user_id)\
            .eq("is_active", True)\
            .execute()

        if response.data:
            return [token["expo_push_token"] for token in response.data]
        return []
    except Exception as e:
        print(f"[get_user_push_tokens] Error: {e}")
        return []
