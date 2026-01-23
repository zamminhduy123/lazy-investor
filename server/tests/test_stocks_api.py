from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_stock_quote():
    response = client.get("/api/v1/stocks/quote?symbol=HPG")
    assert response.status_code == 200
    assert "data" in response.json()

def test_get_stock_intraday():
    response = client.get("/api/v1/stocks/intraday?symbol=HPG")
    assert response.status_code == 200
    assert "data" in response.json()

def test_get_stock_price_depth():
    response = client.get("/api/v1/stocks/price-depth?symbol=HPG")
    assert response.status_code == 200
    assert "data" in response.json()

def test_get_company_info():
    response = client.get("/api/v1/stocks/company?symbol=HPG")
    assert response.status_code == 200
    assert "data" in response.json()

def test_get_company_shareholders():
    response = client.get("/api/v1/stocks/shareholders?symbol=HPG")
    assert response.status_code == 200
    assert "data" in response.json()

def test_get_price_board():
    response = client.get("/api/v1/stocks/price-board?symbols=HPG")
    assert response.status_code == 200
    assert "data" in response.json()

def test_get_all_symbols():
    response = client.get("/api/v1/stocks/all-symbols")
    assert response.status_code == 200
    assert "data" in response.json()

def test_get_indices():
    response = client.get("/api/v1/stocks/indices")
    assert response.status_code == 200
    assert "data" in response.json()