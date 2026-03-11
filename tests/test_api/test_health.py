def test_health_healthy(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["services"]["api"] is True
    assert data["services"]["weaviate"] is True


def test_health_degraded(client, mock_vectorstore_service):
    mock_vectorstore_service.is_healthy.return_value = False
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["services"]["weaviate"] is False
