from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.schemas.product import Product, ProductType
from app.services.products import ProductService
from app.services.analyze_needs import AnalyzeNeedsService, get_analyze_needs_service

router = APIRouter()

# --- Request/Response Models for Needs Analysis ---

class NeedsAnalysisRequest(BaseModel):
    product_category: str

class UserArchetype(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    characteristics: List[str]
    sampleProducts: List[str]
    imageUrl: Optional[str] = None

class NeedsAnalysisResponse(BaseModel):
    user_archetypes: List[UserArchetype]

# --- Request/Response Models for Summary ---

class SummaryRequest(BaseModel):
    keyword: str
    tags: List[str]

class RecommendedProduct(BaseModel):
    rank: int
    recommendation_reason: str
    id: str
    name: str
    price: Optional[float] = None
    description: str
    specs: Optional[Dict[str, Optional[str]]] = None
    specifications: Optional[Dict[str, Any]] = None
    rating: float
    reviewCount: int
    category: str
    tags: List[str]
    source_urls: List[str]

class SummaryResponse(BaseModel):
    recommended_products: List[RecommendedProduct]


# --- Request/Response Models for Product Battle ---

class ProductBattleRequest(BaseModel):
    product_name_1: str
    product_name_2: str

class ProductBattleResponse(BaseModel):
    id: str
    product1_id: str
    product1_name: str
    product1_description: List[str]
    product2_id: str
    product2_name: str
    product2_description: List[str]
    video_url: str


# --- Dependencies ---

def get_product_service():
    return ProductService()


# --- Endpoints ---

@router.post(
    "/analyze-needs", 
    response_model=NeedsAnalysisResponse, 
    summary="Analyze user needs for a product category"
)
async def analyze_needs(
    request: NeedsAnalysisRequest,
    service: AnalyzeNeedsService = Depends(get_analyze_needs_service)
):
    """
    Analyzes user needs for a given product category, generates user archetypes,
    and creates representative images for each archetype.
    """
    try:
        result = await service.analyze_needs_and_generate_images(
            product_category=request.product_category
        )
        return result
    except Exception as e:
        print(f"Error in /analyze-needs endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/summary",
    response_model=SummaryResponse,
    summary="Summarize YouTube videos and recommend products"
)
async def get_summary(
    request: SummaryRequest,
    service: AnalyzeNeedsService = Depends(get_analyze_needs_service)
):
    """
    Takes a product keyword and tags, searches YouTube for review videos, and returns a ranked list of recommended products.
    """
    if not request.keyword:
        raise HTTPException(status_code=400, detail="Keyword cannot be empty.")
    try:
        result = await service.search_youtube_reviews_and_summarize(request.keyword, request.tags)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        print(f"Error in /summary endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/battle",
    response_model=ProductBattleResponse,
    summary="Generate a product battle presentation"
)
async def product_battle(
    request: ProductBattleRequest,
    service: AnalyzeNeedsService = Depends(get_analyze_needs_service)
):
    """
    Generates a battle-style presentation between two products.
    """
    try:
        result = await service.generate_product_battle(
            request.product_name_1, request.product_name_2
        )
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        print(f"Error in /battle endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[Product])
def get_products(service: ProductService = Depends(get_product_service)):
    """Get a list of all products."""
    return service.get_all_products()

@router.get("/types", response_model=List[ProductType])
def get_product_types(service: ProductService = Depends(get_product_service)):
    """Get a list of all product types."""
    return service.get_all_product_types()

@router.get("/{product_id}", response_model=Product)
def get_product_by_id(product_id: str, service: ProductService = Depends(get_product_service)):
    """Get a single product by its ID."""
    product = service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
