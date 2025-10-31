from fastapi import FastAPI, Form, HTTPException, Depends, status, Response, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import httpx
import openai
import os
import io
import PyPDF2
import json
from dotenv import load_dotenv
from jose import JWTError, jwt
import re
import datetime as dt

from models import UserCreate, UserInDB, Token, TokenData, SubscriptionCreate, SubscriptionInDB, get_password_hash, verify_password
from supabase_client import (
    get_user_by_email, create_user, create_subscription, get_subscriptions_by_owner,
    delete_subscription, update_user_last_login, log_analytics_event, get_merchant_cancel_link
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_JWT_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if not SECRET_KEY:
    raise ValueError("SECRET_JWT_KEY not found in environment variables. Please set it in .env")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

TINK_CLIENT_ID = os.getenv("TINK_CLIENT_ID")
TINK_CLIENT_SECRET = os.getenv("TINK_CLIENT_SECRET")
TINK_REDIRECT_URI = os.getenv("TINK_REDIRECT_URI")

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_user(email: str):
    user_data = await get_user_by_email(email)
    if user_data:
        return UserInDB(**user_data)
    return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = await get_user(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/auth/signup", response_model=UserInDB)
async def signup_user(user: UserCreate):
    if await get_user(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user_data = await create_user(user.email, hashed_password)
    return UserInDB(**new_user_data)

@app.post("/api/auth/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Update last login timestamp
    await update_user_last_login(user.id)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/subscriptions", response_model=SubscriptionInDB)
async def create_subscription_endpoint(subscription: SubscriptionCreate, current_user: UserInDB = Depends(get_current_user)):
    # Create subscription data with all fields from new schema
    subscription_data = {
        "title": subscription.title,
        "amount": subscription.amount,
        "renewal_date": subscription.renewal_date,
        "category": subscription.category or "Øvrige",
        "logo_url": subscription.logo_url,
        "currency": subscription.currency or "DKK",
        "owner_id": current_user.id,
        "frequency": subscription.frequency or "måned",
        "source": subscription.source or "manual"
    }

    # Add optional fields if provided
    if subscription.transaction_date:
        subscription_data["transaction_date"] = subscription.transaction_date
    if subscription.confidence_score is not None:
        subscription_data["confidence_score"] = subscription.confidence_score
    if subscription.notes:
        subscription_data["notes"] = subscription.notes

    new_sub = await create_subscription(subscription_data)

    # Log analytics event
    await log_analytics_event(
        user_id=current_user.id,
        event_type="subscription_added",
        subscription_id=new_sub["id"],
        merchant_name=subscription.title,
        event_data={"source": subscription.source or "manual", "category": subscription.category}
    )

    return SubscriptionInDB(**new_sub)

@app.get("/api/subscriptions", response_model=List[SubscriptionInDB])
async def read_subscriptions(current_user: UserInDB = Depends(get_current_user)):
    subs = await get_subscriptions_by_owner(current_user.id)
    return [SubscriptionInDB(**sub) for sub in subs]

@app.delete("/api/subscriptions/{subscription_id}")
async def delete_subscription_endpoint(subscription_id: int, current_user: UserInDB = Depends(get_current_user)):
    # First check if subscription belongs to current user
    subs = await get_subscriptions_by_owner(current_user.id)
    subscription = next((sub for sub in subs if sub["id"] == subscription_id), None)

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found or not owned by user")

    # Log analytics event before deleting
    await log_analytics_event(
        user_id=current_user.id,
        event_type="subscription_deleted",
        subscription_id=subscription_id,
        merchant_name=subscription.get("title")
    )

    # Delete the subscription (soft delete)
    await delete_subscription(subscription_id)
    return {"message": "Subscription deleted successfully"}

@app.get("/api/merchant-links/{merchant_name}")
async def get_merchant_link(merchant_name: str, current_user: UserInDB = Depends(get_current_user)):
    """Get cancellation link for a specific merchant"""
    link = await get_merchant_cancel_link(merchant_name)
    if not link:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return link

@app.get("/api/user/summary")
async def get_user_summary(current_user: UserInDB = Depends(get_current_user)):
    subs = await get_subscriptions_by_owner(current_user.id)
    monthly_total = sum(sub["amount"] for sub in subs)
    top3_expensive = sorted(subs, key=lambda x: x["amount"], reverse=True)[:3]
    category_spending = {}
    for sub in subs:
        cat = sub.get("category", "Ukategoriseret")
        category_spending[cat] = category_spending.get(cat, 0) + sub["amount"]
    
    # Calculate monthly history based on transaction dates and frequency
    monthly_history = {}
    current_date = datetime.now()
    
    # Generate data for last 6 months
    for i in range(6):
        month_date = current_date - timedelta(days=30 * i)
        month_key = f"{month_date.month} {month_date.year}"
        monthly_spending = 0
        
        for sub in subs:
            # Use transaction_date if available, otherwise use renewal_date
            date_to_use = sub.get("transaction_date") or sub.get("renewal_date")
            if not date_to_use:
                # If no date available, include in current month only
                if i == 0:
                    monthly_spending += sub["amount"]
                continue
            
            try:
                # Parse the date (handle both ISO format with time and simple date)
                if 'T' in date_to_use:
                    base_date = datetime.fromisoformat(date_to_use.replace('Z', '+00:00'))
                else:
                    base_date = datetime.strptime(date_to_use, "%Y-%m-%d")
                
                # Check if this subscription was active in this month
                # For monthly subscriptions, check if the transaction was within the last year
                # and would have had a payment in this specific month
                months_diff = (month_date.year - base_date.year) * 12 + (month_date.month - base_date.month)
                
                # Simple logic: if transaction was in the past and this month would have a payment
                if base_date <= month_date:
                    # For monthly subscriptions, include if months_diff is non-negative and reasonable
                    if months_diff >= 0 and months_diff <= 12:  # Within last year
                        monthly_spending += sub["amount"]
                        
            except Exception as e:
                print(f"Error parsing date {date_to_use} for subscription {sub.get('title', 'unknown')}: {e}")
                # If date parsing fails, include in current month only
                if i == 0:
                    monthly_spending += sub["amount"]
        
        monthly_history[month_key] = monthly_spending
    
    return {
        "monthly_total": monthly_total,
        "top3_expensive": top3_expensive,
        "category_spending": [{"category": k, "total": v} for k, v in category_spending.items()],
        "monthly_history": monthly_history
    }

class TinkTokenRequest(BaseModel):
    code: str

@app.post("/api/tink/token", response_model=Token)
async def exchange_code_for_token(request: TinkTokenRequest):
    import time
    timestamp = time.strftime("%H:%M:%S")
    print(f"🔄 [{timestamp}] NEW TOKEN EXCHANGE REQUEST")
    print(f"🔄 Starting token exchange for code: {request.code[:20]}...")
    data = {
        "client_id": TINK_CLIENT_ID,
        "client_secret": TINK_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": request.code,
        "redirect_uri": TINK_REDIRECT_URI,
    }
    print(f"📤 Sending request to Tink with data:")
    print(f"   client_id: {TINK_CLIENT_ID}")
    print(f"   redirect_uri: {TINK_REDIRECT_URI}")
    print(f"   code: {request.code[:20]}...")
    try:
        async with httpx.AsyncClient() as client:
            print("📡 Making request to Tink token endpoint...")
            response = await client.post("https://api.tink.com/api/v1/oauth/token", data=data)
            print(f"📊 Tink response status: {response.status_code}")
            print(f"📊 Tink response headers: {dict(response.headers)}")
            print(f"📊 Tink response body: {response.text}")
            response.raise_for_status()
            token_data = response.json()
            print(f"✅ Token exchange successful! Token: {token_data.get('access_token', '')[:20]}...")
            return Token(access_token=token_data["access_token"], token_type="bearer")
    except httpx.HTTPError as e:
        detail = e.response.text if e.response else str(e)
        print(f"❌ Tink token exchange failed!")
        print(f"❌ Status code: {e.response.status_code if e.response else 'Unknown'}")
        print(f"❌ Response: {detail}")
        raise HTTPException(status_code=e.response.status_code if e.response else 400, detail=f"Tink token exchange error: {detail}")

@app.get("/api/tink/transactions")
async def get_tink_transactions(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    print(f"🔍 Fetching Tink data with token: {token[:20]}...")
    try:
        async with httpx.AsyncClient() as client:
            print("📡 Fetching accounts from Tink...")
            accounts_resp = await client.get("https://api.tink.com/data/v2/accounts", headers=headers)
            print(f"📊 Accounts response status: {accounts_resp.status_code}")
            print(f"📊 Accounts response: {accounts_resp.text[:500]}...")
            accounts_resp.raise_for_status()
            accounts = accounts_resp.json().get("accounts", [])
            print(f"🏦 Found {len(accounts)} accounts")
            
            all_transactions = []
            for acc in accounts:
                acc_id = acc.get("id")
                acc_name = acc.get("name", "Unknown")
                print(f"💳 Processing account: {acc_name} (ID: {acc_id})")
                if acc_id:
                    tx_resp = await client.get("https://api.tink.com/data/v2/transactions", headers=headers, params={"accountId": acc_id, "limit": 100})
                    print(f"💰 Transactions response status for {acc_name}: {tx_resp.status_code}")
                    print(f"💰 Transactions response: {tx_resp.text[:500]}...")
                    tx_resp.raise_for_status()
                    transactions = tx_resp.json().get("transactions", [])
                    print(f"💰 Found {len(transactions)} transactions for {acc_name}")
                    all_transactions.extend(transactions)
            
            print(f"✅ Total transactions found: {len(all_transactions)}")
            return {"transactions": all_transactions}
    except httpx.HTTPError as e:
        detail = e.response.text if e.response else str(e)
        print(f"❌ Tink API error: {e.response.status_code if e.response else 'Unknown'}")
        print(f"❌ Error detail: {detail}")
        raise HTTPException(status_code=e.response.status_code if e.response else 400, detail=f"Tink fetch error: {detail}")

@app.get("/api/tink/accounts")
async def get_tink_accounts(token: str):
    """Test endpoint to fetch only accounts from Tink"""
    headers = {"Authorization": f"Bearer {token}"}
    print(f"🔍 Testing accounts fetch with token: {token[:20]}...")
    print(f"🔍 Full token length: {len(token)}")
    print(f"🔍 Headers being sent: {headers}")
    try:
        async with httpx.AsyncClient() as client:
            print("📡 Fetching accounts from Tink...")
            accounts_resp = await client.get("https://api.tink.com/data/v2/accounts", headers=headers)
            print(f"📊 Accounts response status: {accounts_resp.status_code}")
            print(f"📊 Accounts response headers: {dict(accounts_resp.headers)}")
            print(f"📊 Accounts response: {accounts_resp.text}")
            accounts_resp.raise_for_status()
            accounts_data = accounts_resp.json()
            print(f"🏦 Accounts data: {accounts_data}")
            return accounts_data
    except httpx.HTTPError as e:
        detail = e.response.text if e.response else str(e)
        print(f"❌ Tink accounts error: {e.response.status_code if e.response else 'Unknown'}")
        print(f"❌ Error detail: {detail}")
        print(f"❌ Request URL: https://api.tink.com/data/v2/accounts")
        print(f"❌ Request headers: {headers}")
        raise HTTPException(status_code=e.response.status_code if e.response else 400, detail=f"Tink accounts error: {detail}")

@app.get("/api/debug/env")
async def debug_env():
    """Debug endpoint to check environment variables"""
    return {
        "TINK_CLIENT_ID": TINK_CLIENT_ID,
        "TINK_CLIENT_SECRET": TINK_CLIENT_SECRET[:10] + "..." if TINK_CLIENT_SECRET else None,
        "TINK_REDIRECT_URI": TINK_REDIRECT_URI,
        "SECRET_KEY_SET": bool(SECRET_KEY),
    }

@app.get("/api/debug/test-token")
async def test_token(token: str):
    """Test endpoint to manually test a Tink token"""
    headers = {"Authorization": f"Bearer {token}"}
    print(f"🧪 Manual token test with: {token[:30]}...")
    
    try:
        async with httpx.AsyncClient() as client:
            # Test accounts endpoint
            print("🧪 Testing accounts endpoint...")
            accounts_resp = await client.get("https://api.tink.com/data/v2/accounts", headers=headers)
            print(f"🧪 Accounts status: {accounts_resp.status_code}")
            print(f"🧪 Accounts response: {accounts_resp.text[:200]}...")
            
            if accounts_resp.status_code == 200:
                accounts_data = accounts_resp.json()
                return {
                    "success": True,
                    "accounts_count": len(accounts_data.get("accounts", [])),
                    "accounts": accounts_data.get("accounts", [])[:2]  # First 2 accounts
                }
            else:
                return {
                    "success": False,
                    "status": accounts_resp.status_code,
                    "error": accounts_resp.text
                }
    except Exception as e:
        print(f"🧪 Test failed: {e}")
        return {"success": False, "error": str(e)}

class TransactionAnalysisRequest(BaseModel):
    transactions: List[dict]

@app.post("/api/ai/analyze-subscriptions")
async def analyze_subscriptions_with_ai(request: TransactionAnalysisRequest, current_user: UserInDB = Depends(get_current_user)):
    """Use OpenAI to intelligently detect subscriptions from transactions"""
    print(f"🤖 Starting AI analysis of {len(request.transactions)} transactions...")
    
    try:
        # Group transactions by description
        groups = {}
        for tx in request.transactions:
            desc = tx.get("descriptions", {}).get("display", "") or tx.get("descriptions", {}).get("original", "")
            if not desc or desc == "Ukendt":
                continue
            if desc not in groups:
                groups[desc] = []
            groups[desc].append(tx)
        
        print(f"🔍 Grouped into {len(groups)} unique transaction descriptions")
        
        # Only analyze groups with 2+ transactions
        recurring_groups = {desc: txs for desc, txs in groups.items() if len(txs) >= 2}
        print(f"📊 Found {len(recurring_groups)} recurring transaction groups")
        
        if not recurring_groups:
            return {"subscriptions": []}
        
        # Prepare data for OpenAI analysis
        transaction_summaries = []
        for desc, txs in recurring_groups.items():
            amounts = []
            dates = []
            for tx in txs:
                try:
                    unscaled = float(tx.get("amount", {}).get("value", {}).get("unscaledValue", 0))
                    scale = int(tx.get("amount", {}).get("value", {}).get("scale", 0))
                    amount = abs(unscaled / (10 ** scale))
                    amounts.append(amount)
                    dates.append(tx.get("dates", {}).get("booked", ""))
                except:
                    continue
            
            if amounts:
                avg_amount = sum(amounts) / len(amounts)
                transaction_summaries.append({
                    "description": desc,
                    "frequency": len(txs),
                    "average_amount": round(avg_amount, 2),
                    "amount_range": f"{min(amounts):.2f}-{max(amounts):.2f} DKK",
                    "dates": sorted(dates)[-3:]  # Last 3 dates
                })
        
        # Create prompt for OpenAI
        prompt = f"""
Analyser følgende danske banktransaktioner og identificer hvilke der er abonnementer/subscriptions.

For hver transaktion skal du bestemme:
1. Er det et abonnement? (ja/nej)
2. Confidence score (0-100%)
3. Præcist virksomhedsnavn (forkort og rens - f.eks. "SPLICE.COM* CREATOR" → "Splice", "DISNEYPLUS.COM DK" → "Disney+")
4. Kategori (Streaming & Underholdning, Forsikring & Pension, Telekom & Internet, osv.)
5. Betalingsfrekvens (måned/kvartal/halvår/år)
6. Næste fornyelsesdato (baseret på frekvens og seneste betaling)

Transaktioner:
{chr(10).join([f"- {t['description']}: {t['frequency']} gange, gennemsnit {t['average_amount']} DKK, seneste datoer: {', '.join(t['dates'])}" for t in transaction_summaries[:20]])}

Returner JSON format:
[
  {{
    "original_description": "SPLICE.COM* CREATOR",
    "clean_name": "Splice",
    "is_subscription": true,
    "confidence": 95,
    "category": "Software & Værktøjer",
    "frequency": "måned",
    "next_renewal_date": "2024-02-15",
    "reasoning": "Kendt musik-software abonnement med regelmæssige månedlige betalinger"
  }}
]

Vigtige regler:
- Rens virksomhedsnavne: fjern .COM, *, CREATOR osv. og gør dem læselige
- Beregn næste fornyelsesdato baseret på frekvens og seneste betaling
- Fokuser på danske tjenester og vær konservativ
- Kun klassificer som abonnement hvis du er sikker
"""

        # Call OpenAI API
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Du er en ekspert i danske banktransaktioner og abonnementer. Analyser transaktioner og identificer abonnementer præcist."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            ai_response = response.choices[0].message.content
            print(f"🤖 OpenAI response: {ai_response[:500]}...")
        except Exception as openai_error:
            print(f"❌ OpenAI API call failed: {openai_error}")
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(openai_error)}")
        
        # Parse AI response
        try:
            ai_results = json.loads(ai_response)
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            # Try to extract JSON from response
            json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
            if json_match:
                try:
                    ai_results = json.loads(json_match.group())
                except json.JSONDecodeError:
                    print("❌ Failed to parse extracted JSON")
                    return {"subscriptions": []}
            else:
                print("❌ No JSON array found in AI response")
                print(f"❌ AI response was: {ai_response}")
                return {"subscriptions": []}
        
        # Convert AI results to subscription format
        detected_subscriptions = []
        for result in ai_results:
            if result.get("is_subscription", False) and result.get("confidence", 0) >= 70:
                # Use original_description to find the transaction group, but clean_name for display
                original_desc = result.get("original_description", result.get("description", ""))
                clean_name = result.get("clean_name", clean_description(original_desc))
                
                if original_desc in recurring_groups:
                    txs = recurring_groups[original_desc]
                    amounts = []
                    dates = []
                    
                    for tx in txs:
                        try:
                            unscaled = float(tx.get("amount", {}).get("value", {}).get("unscaledValue", 0))
                            scale = int(tx.get("amount", {}).get("value", {}).get("scale", 0))
                            amount = abs(unscaled / (10 ** scale))
                            amounts.append(amount)
                            dates.append(tx.get("dates", {}).get("booked", ""))
                        except:
                            continue
                    
                    if amounts and dates:
                        avg_amount = sum(amounts) / len(amounts)
                        
                        # Use AI-provided next_renewal_date if available, otherwise calculate
                        if result.get("next_renewal_date"):
                            renewal_date = result["next_renewal_date"]
                        else:
                            sorted_dates = sorted([d for d in dates if d])
                            from datetime import datetime, timedelta
                            last_date = datetime.fromisoformat(sorted_dates[-1].replace('Z', '+00:00'))
                            
                            freq_days = {"måned": 30, "kvartal": 90, "halvår": 180, "år": 365}
                            days_to_add = freq_days.get(result.get("frequency", "måned"), 30)
                            next_renewal = last_date + timedelta(days=days_to_add)
                            renewal_date = next_renewal.strftime("%Y-%m-%d")
                        
                        detected_subscriptions.append({
                            "name": clean_name,
                            "amount": round(avg_amount, 2),
                            "category": result.get("category", "Øvrige"),
                            "frequency": result.get("frequency", "måned"),
                            "confidence": result.get("confidence", 70),
                            "renewal_date": renewal_date,
                            "transaction_date": sorted_dates[-1] if sorted_dates else None,  # Most recent transaction date
                            "reasoning": result.get("reasoning", "AI detected subscription"),
                            "source": "tink"  # Mark as coming from Tink integration
                        })
        
        print(f"🎯 AI detected {len(detected_subscriptions)} subscriptions")
        return {"subscriptions": detected_subscriptions}
        
    except Exception as e:
        print(f"❌ AI analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis error: {str(e)}")

@app.post("/api/ai/analyze-pdf")
async def analyze_pdf_with_ai(file: UploadFile = File(...), current_user: UserInDB = Depends(get_current_user)):
    """Use OpenAI to analyze PDF bank statements and detect subscriptions"""
    print(f"🤖 Starting PDF analysis for file: {file.filename}")
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read PDF content
        pdf_content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
        
        # Extract text from all pages
        text_content = ""
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text_content += page.extract_text() + "\n"
        
        print(f"📄 Extracted {len(text_content)} characters from PDF")
        print(f"📄 Sample content: {text_content[:500]}...")
        
        if len(text_content.strip()) < 100:
            raise HTTPException(status_code=400, detail="PDF contains insufficient text content")
        
        # Build map of cleaned description -> latest transaction date found in PDF
        date_pattern = re.compile(r"(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})")
        desc_last_date = {}
        for line in text_content.splitlines():
            if not line.strip():
                continue
            m_date = date_pattern.search(line)
            if not m_date:
                continue
            date_str = m_date.group(1)
            # normalize separators
            date_str_norm = date_str.replace('.', '/').replace('-', '/')
            try:
                dt_obj = dt.datetime.strptime(date_str_norm, "%d/%m/%Y")
            except ValueError:
                try:
                    dt_obj = dt.datetime.strptime(date_str_norm, "%d/%m/%y")
                except ValueError:
                    continue
            # remove date part from line then clean
            desc_part = line.replace(date_str, "").strip()
            clean_desc = clean_description(desc_part)
            key = clean_desc.lower()
            if key in desc_last_date:
                if dt_obj > desc_last_date[key]:
                    desc_last_date[key] = dt_obj
            else:
                desc_last_date[key] = dt_obj
        
        # Create prompt for OpenAI to analyze bank statement
        prompt = f"""
Analyser følgende danske kontoudtog og identificer alle abonnementer/subscriptions.

Kontoudtog indhold:
{text_content[:8000]}  # Limit to avoid token limits

For hver potentiel abonnement skal du bestemme:
1. Er det et abonnement? (ja/nej)
2. Confidence score (0-100%)
3. Præcist virksomhedsnavn (forkort og rens - f.eks. "SPLICE.COM* CREATOR" → "Splice", "DISNEYPLUS.COM DK" → "Disney+")
4. Beløb (DKK)
5. Kategori (Streaming & Underholdning, Forsikring & Pension, Telekom & Internet, osv.)
6. Betalingsfrekvens (måned/kvartal/halvår/år)
7. Næste fornyelsesdato (baseret på frekvens og seneste betaling fra kontoudtoget)

Returner JSON format:
[
  {{
    "original_description": "SPLICE.COM* CREATOR",
    "clean_name": "Splice",
    "amount": 199.0,
    "is_subscription": true,
    "confidence": 95,
    "category": "Software & Værktøjer",
    "frequency": "måned",
    "next_renewal_date": "2024-02-15",
    "reasoning": "Kendt musik-software abonnement med regelmæssige månedlige betalinger"
  }}
]

Vigtige regler:
- Rens virksomhedsnavne: fjern .COM, *, CREATOR osv. og gør dem læselige
- Beregn næste fornyelsesdato baseret på frekvens og seneste betaling, så hvis sidste betaling var 2024-02-15 og frekvensen er månedlig, så er næste fornyelsesdato 2024-03-15
- Fokuser på regelmæssige betalinger (samme beløb, samme modtager)
- Kendte abonnementstjenester (Netflix, Spotify, forsikring osv.)
- Beløb mellem 20-1000 DKK
- Undgå engangskøb, tankninger, restauranter
- Vær konservativ - kun klassificer som abonnement hvis du er sikker
- Hvis du finder en virksomhed som ikke typisk er et abonnement, men har muligheden for et abonnement og det er et fast beløb, så søg på nettet og revurdér om det kunne være et abonnement. Et eksempel på dette kunne være "Wolt" som typisk er engangskøb, men også har muligheden for abonnement "Wolt+".
"""

        # Call OpenAI API
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Du er en ekspert i banktransaktioner og abonnementer. Analyser kontoudtog og identificer abonnementer præcist."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=3000
            )
            
            ai_response = response.choices[0].message.content
            print(f"🤖 OpenAI PDF response: {ai_response[:500]}...")
        except Exception as openai_error:
            print(f"❌ OpenAI PDF API call failed: {openai_error}")
            raise HTTPException(status_code=500, detail=f"OpenAI PDF API error: {str(openai_error)}")
        
        # Parse AI response
        try:
            ai_results = json.loads(ai_response)
        except json.JSONDecodeError as e:
            print(f"❌ PDF JSON decode error: {e}")
            # Try to extract JSON from response
            json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
            if json_match:
                try:
                    ai_results = json.loads(json_match.group())
                except json.JSONDecodeError:
                    print("❌ Failed to parse extracted PDF JSON")
                    return {"subscriptions": []}
            else:
                print("❌ No JSON array found in PDF AI response")
                print(f"❌ PDF AI response was: {ai_response}")
                return {"subscriptions": []}
        
        # Convert AI results to subscription format
        detected_subscriptions = []
        for result in ai_results:
            if result.get("is_subscription", False) and result.get("confidence", 0) >= 70:
                # Use clean_name from AI if available, otherwise clean the original description
                clean_name = result.get("clean_name")
                if not clean_name:
                    original_desc = result.get("original_description", result.get("description", ""))
                    clean_name = clean_description(original_desc)
                
                # Use AI-provided next_renewal_date if available, otherwise calculate
                if result.get("next_renewal_date"):
                    renewal_date = result["next_renewal_date"]
                else:
                    from datetime import timedelta
                    freq_days = {"måned": 30, "kvartal": 90, "halvår": 180, "år": 365}
                    days_to_add = freq_days.get(result.get("frequency", "måned"), 30)

                    key = clean_name.lower()
                    last_dt = desc_last_date.get(key)
                    if last_dt:
                        next_renewal_dt = last_dt + timedelta(days=days_to_add)
                    else:
                        # fallback to today
                        next_renewal_dt = dt.datetime.now() + timedelta(days=days_to_add)
                    renewal_date = next_renewal_dt.strftime("%Y-%m-%d")
                
                # Get transaction date from PDF data
                key = clean_name.lower()
                transaction_date = None
                if key in desc_last_date:
                    transaction_date = desc_last_date[key].strftime("%Y-%m-%d")
                
                detected_subscriptions.append({
                    "name": clean_name,
                    "amount": float(result.get("amount", 0)),
                    "category": result.get("category", "Øvrige"),
                    "frequency": result.get("frequency", "måned"),
                    "confidence": result.get("confidence", 70),
                    "renewal_date": renewal_date,
                    "transaction_date": transaction_date,  # Include actual transaction date from PDF
                    "reasoning": result.get("reasoning", "PDF AI detected subscription"),
                    "source": "pdf"  # Mark as coming from PDF upload
                })
        
        print(f"🎯 PDF AI detected {len(detected_subscriptions)} subscriptions")
        return {"subscriptions": detected_subscriptions}
        
    except Exception as e:
        print(f"❌ PDF analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF analysis error: {str(e)}")

@app.on_event("startup")
async def create_db_tables():
    print("Ensure 'users' and 'subscriptions' tables exist in Supabase.")

# ---------- Helper utilities ----------

def clean_description(desc: str) -> str:
    """Normalize merchant/description strings to nice subscription titles.

    Examples:
    "OPENAI *CHATGPT"      -> "Openai Chatgpt"
    "SPLICE.COM* CREATOR"  -> "Splice Creator"
    "DISNEYPLUS.COM  DK"   -> "Disneyplus"
    "www.netflix.com"      -> "Netflix"
    "TRYG FORSIKRING A/S"  -> "Tryg Forsikring A S"
    """
    if not desc:
        return "Ukendt"
    text = desc.lower()

    # Remove protocol
    text = re.sub(r"https?://", "", text)

    # Replace delimiters * / - with space
    text = re.sub(r"[*/_-]", " ", text)

    # Remove domain suffixes (.com, .dk etc.)
    text = re.sub(r"\b[a-z0-9]+\.(com|dk|io|net|org|se|co)\b", "", text)

    # Remove multiple spaces and non-alphanumeric (keep danish chars)
    text = re.sub(r"[^a-z0-9æøå \s]", "", text)
    text = re.sub(r"\s{2,}", " ", text).strip()

    return text.title()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
