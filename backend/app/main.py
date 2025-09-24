import os
import secrets

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.api.v1 import chat, products
from app.core.config import settings

app = FastAPI(
    title="AI Product Search API",
    description="API for AI-powered product search and comparison.",
    version="0.1.0",
)

security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    # Get credentials from settings
    expected_username = settings.BASIC_AUTH_USERNAME
    expected_password = settings.BASIC_AUTH_PASSWORD

    # Securely check if variables are set and not empty
    if not (expected_username and expected_password):
        # This is a server-side configuration error.
        # Do not allow any authentication to proceed.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error: Basic auth credentials are not configured.",
        )

    is_username_correct = secrets.compare_digest(credentials.username, expected_username)
    is_password_correct = secrets.compare_digest(credentials.password, expected_password)

    if not (is_username_correct and is_password_correct):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# CORS settings
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://frontend-588575437986.asia-northeast1.run.app", # Deployed frontend URL
    "https://frontend-588575437986.us-central1.run.app", # Deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    products.router, 
    prefix="/api/v1/products", 
    tags=["products"], 
    dependencies=[Depends(authenticate)]
)
app.include_router(
    chat.router, 
    prefix="/api/v1/chat", 
    tags=["chat"], 
    dependencies=[Depends(authenticate)]
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Product Search API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
