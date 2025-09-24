from app.services.products import ProductService
from app.schemas.product import Product, ProductType
import pytest

@pytest.fixture(autouse=True)
def mock_product_service(monkeypatch):
    mock_products_data = [
        Product(
            id="p1", name="Product One", price=10.0, imageUrl="url1", description="desc1",
            specifications={}, rating=4.0, reviewCount=10, category="cat1", tags=[]
        ),
        Product(
            id="p2", name="Product Two", price=20.0, imageUrl="url2", description="desc2",
            specifications={}, rating=4.5, reviewCount=20, category="cat2", tags=[]
        ),
    ]
    mock_product_types_data = [
        ProductType(
            id="t1", name="Type One", description="type_desc1", imageUrl="type_url1",
            characteristics=[], sampleProducts=[]
        ),
    ]

    monkeypatch.setattr(ProductService, "get_all_products", lambda self: mock_products_data)
    monkeypatch.setattr(ProductService, "get_product_by_id", lambda self, product_id: next((p for p in mock_products_data if p.id == product_id), None))
    monkeypatch.setattr(ProductService, "get_all_product_types", lambda self: mock_product_types_data)

def test_get_all_products(client):
    response = client.get("/api/v1/products/")
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["name"] == "Product One"

def test_get_product_by_id(client):
    response = client.get("/api/v1/products/p1")
    assert response.status_code == 200
    assert response.json()["name"] == "Product One"

def test_get_product_by_id_not_found(client):
    response = client.get("/api/v1/products/p99")
    assert response.status_code == 404

def test_get_all_product_types(client):
    response = client.get("/api/v1/products/types")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Type One"
