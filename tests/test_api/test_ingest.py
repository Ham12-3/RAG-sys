import io


def test_ingest_text_file(client, mock_embedding_service):
    mock_embedding_service.embed_texts.return_value = [[0.1] * 384] * 3

    file_content = b"This is a test document. " * 50
    response = client.post(
        "/ingest",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
        data={"chunking_strategy": "recursive_character", "chunk_size": "200"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "test.txt"
    assert data["total_chunks"] > 0
    assert "document_id" in data
    assert data["embedding_provider"] == "sentence-transformers"


def test_ingest_empty_file(client):
    response = client.post(
        "/ingest",
        files={"file": ("empty.txt", io.BytesIO(b""), "text/plain")},
    )
    assert response.status_code == 400


def test_ingest_with_sentence_chunking(client, mock_embedding_service):
    mock_embedding_service.embed_texts.return_value = [[0.1] * 384] * 5

    file_content = b"First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence."
    response = client.post(
        "/ingest",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
        data={"chunking_strategy": "sentence", "chunk_size": "100"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_chunks"] >= 1
