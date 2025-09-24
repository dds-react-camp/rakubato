from app.schemas.product import Product, ProductType

mock_products = [
    Product(
        id="prod_001",
        name="SpeedMaster Pro X",
        price=1200.00,
        imageUrl="https://placehold.co/400x250/e5e7eb/4b5563?text=SpeedMaster",
        description="A professional-grade laptop for demanding tasks.",
        specifications={"CPU": "Intel Core i9", "RAM": "32GB", "Storage": "1TB SSD"},
        rating=4.8,
        reviewCount=256,
        category="laptop",
        tags=["high-performance", "professional", "durable"]
    ),
    Product(
        id="prod_002",
        name="FeatherLight Air",
        price=950.00,
        imageUrl="https://placehold.co/400x250/e5e7eb/4b5563?text=FeatherLight",
        description="Ultra-light and portable for on-the-go productivity.",
        specifications={"CPU": "Intel Core i5", "RAM": "16GB", "Storage": "512GB SSD"},
        rating=4.5,
        reviewCount=512,
        category="laptop",
        tags=["lightweight", "portable", "student"]
    ),
    Product(
        id="prod_003",
        name="Galaxy View Tab",
        price=750.00,
        imageUrl="https://placehold.co/400x250/e5e7eb/4b5563?text=Galaxy+View",
        description="A stunning tablet for media consumption and creativity.",
        specifications={"Screen": "12.9-inch Liquid Retina", "Processor": "M2 Chip"},
        rating=4.9,
        reviewCount=1024,
        category="tablet",
        tags=["large-screen", "creative", "high-resolution"]
    ),
    Product(
        id="prod_004",
        name="PixelPerfect Camera Phone",
        price=999.00,
        imageUrl="https://placehold.co/400x250/e5e7eb/4b5563?text=PixelPerfect",
        description="Capture life's moments in stunning detail.",
        specifications={"Camera": "108MP Quad-Camera", "Battery": "5000mAh"},
        rating=4.7,
        reviewCount=890,
        category="smartphone",
        tags=["camera", "photography", "flagship"]
    ),
]

mock_product_types = [
    ProductType(
        id="laptop",
        name="Laptop",
        description="Powerful and portable for work and play.",
        imageUrl="https://placehold.co/200x150/6366f1/ffffff?text=Laptop",
        characteristics=["High Performance", "Portability", "Versatility"],
        sampleProducts=mock_products[0:2]
    ),
    ProductType(
        id="tablet",
        name="Tablet",
        description="The perfect blend of portability and power.",
        imageUrl="https://placehold.co/200x150/34d399/ffffff?text=Tablet",
        characteristics=["Large Screen", "Lightweight", "Creative Tools"],
        sampleProducts=[mock_products[2]]
    ),
    ProductType(
        id="smartphone",
        name="Smartphone",
        description="Stay connected and productive on the go.",
        imageUrl="https://placehold.co/200x150/f59e0b/ffffff?text=Phone",
        characteristics=["Ultimate Portability", "Great Cameras", "All-day Battery"],
        sampleProducts=[mock_products[3]]
    ),
]
