def test_evaluate_success(client, mock_vectorstore_service):
    mock_vectorstore_service.search.return_value = [
        {"text": "chunk", "source": "a.txt", "chunk_index": 0, "document_id": "doc-1", "relevance_score": 0.9},
        {"text": "chunk2", "source": "a.txt", "chunk_index": 1, "document_id": "doc-2", "relevance_score": 0.8},
    ]

    response = client.post("/evaluate", json={
        "queries": [
            {"query": "test query", "relevant_doc_ids": ["doc-1"]},
        ],
        "top_k": 5,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["total_queries"] == 1
    assert data["aggregate_recall_at_k"] >= 0
    assert data["aggregate_mrr"] >= 0
    assert data["aggregate_ndcg"] >= 0
    assert len(data["per_query"]) == 1


def test_evaluate_empty_queries(client):
    response = client.post("/evaluate", json={"queries": []})
    assert response.status_code == 422
