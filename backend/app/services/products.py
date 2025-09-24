from typing import List, Optional
from .mock_data import mock_products, mock_product_types
from app.schemas.product import Product, ProductType

class ProductService:
    def get_all_products(self) -> List[Product]:
        """Returns all products from the mock data."""
        return mock_products

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        """Finds a product by its ID in the mock data."""
        for product in mock_products:
            if product.id == product_id:
                return product
        return None

    def get_all_product_types(self) -> List[ProductType]:
        """Returns all product types from the mock data."""
        return mock_product_types

    def search_products(self, query: str) -> List[Product]:
        """Searches for products by name or description in the mock data."""
        if not query:
            return []
        
        lower_query = query.lower()
        return [p for p in mock_products 
                if lower_query in p.name.lower() or lower_query in p.description.lower()]
