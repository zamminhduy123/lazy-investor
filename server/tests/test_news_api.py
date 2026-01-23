from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_company_news():
    # Use RSS fallback for stability; vnstock may rate-limit or return empty.
    response = client.get("/api/v1/news/company?symbol=HPG&limit=3&fallbackToGoogle=true")
    assert response.status_code == 200

    payload = response.json()
    assert "symbol" in payload
    assert payload["symbol"] == "HPG"

    # status can be ok or no_data depending on RSS availability
    assert payload.get("status") in ("ok", "no_data")
    assert "data" in payload
    assert isinstance(payload["data"], list)
