from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Product(BaseModel):
    id: str
    name: str
    price: float
    image_url: str = Field(..., alias="imageUrl")
    description: Optional[str] = None
    specifications: Dict[str, str]
    rating: float
    review_count: int = Field(..., alias="reviewCount")
    category: str
    tags: List[str]

class ProductType(BaseModel):
    id: str
    name: str
    description: str
    image_url: str = Field(..., alias="imageUrl")
    characteristics: List[str]
    sample_products: List[Product] = Field(..., alias="sampleProducts")
