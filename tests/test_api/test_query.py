def test_query_success(client):
    response = client.post("/query", json={"query": "What is the test about?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "citations" in data
    assert "grounding" in data
    assert "latency" in data
    assert data["latency"]["total_ms"] >= 0
    assert data["grounding"]["grounding_score"] >= 0


def test_query_with_top_k(client):
    response = client.post("/query", json={"query": "test", "top_k": 3})
    assert response.status_code == 200


def test_query_empty_string(client):
    response = client.post("/query", json={"query": ""})
    assert response.status_code == 422  # Validation error
