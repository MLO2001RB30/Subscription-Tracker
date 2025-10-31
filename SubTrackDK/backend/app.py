from fastapi import FastAPI, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from typing import List, Optional
from datetime import datetime, timedelta

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tink API configuration
CLIENT_ID = "c5bee9bff49b45aaa32743b49d36901a"
CLIENT_SECRET = "8935aef3977247d6a176edd86a11c909"
REDIRECT_URI = "exp://0jly2yy-mads_olsen-8081.exp.direct"

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int

class Transaction(BaseModel):
    id: str
    description: str
    amount: dict
    date: str
    accountId: str

@app.post("/api/tink/token", response_model=TokenResponse)
async def exchange_code_for_token(code: str = Form(...)):
    """
    Exchange authorization code for access token
    """
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tink.com/api/v1/oauth/token",
                data=data
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error exchanging code for token: {str(e)}"
        )

@app.get("/api/tink/transactions")
async def get_transactions(token: str):
    """
    Fetch transactions from Tink API
    """
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with httpx.AsyncClient() as client:
            # Get accounts first
            accounts_response = await client.get(
                "https://api.tink.com/data/v2/accounts",
                headers=headers
            )
            accounts_response.raise_for_status()
            accounts = accounts_response.json().get("accounts", [])
            
            # Get transactions for each account
            all_transactions = []
            for account in accounts:
                account_id = account.get("id")
                if account_id:
                    transactions_response = await client.get(
                        f"https://api.tink.com/data/v2/transactions",
                        headers=headers,
                        params={"accountId": account_id}
                    )
                    transactions_response.raise_for_status()
                    transactions = transactions_response.json().get("transactions", [])
                    all_transactions.extend(transactions)
            
            return {"transactions": all_transactions}
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error fetching transactions: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 