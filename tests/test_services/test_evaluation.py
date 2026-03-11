import math

from app.services.evaluation import EvaluationService


def test_recall_at_k():
    svc = EvaluationService.__new__(EvaluationService)
    assert svc._recall_at_k(["a", "b", "c"], {"a", "c"}, 3) == 1.0
    assert svc._recall_at_k(["a", "b", "c"], {"a", "d"}, 3) == 0.5
    assert svc._recall_at_k(["a", "b", "c"], {"d", "e"}, 3) == 0.0


def test_reciprocal_rank():
    svc = EvaluationService.__new__(EvaluationService)
    assert svc._reciprocal_rank(["a", "b", "c"], {"a"}) == 1.0
    assert svc._reciprocal_rank(["a", "b", "c"], {"b"}) == 0.5
    assert svc._reciprocal_rank(["a", "b", "c"], {"c"}) == pytest.approx(1 / 3)
    assert svc._reciprocal_rank(["a", "b", "c"], {"d"}) == 0.0


def test_ndcg():
    svc = EvaluationService.__new__(EvaluationService)
    # Perfect ranking: relevant doc at position 0
    ndcg = svc._ndcg(["a"], {"a"}, 1)
    assert ndcg == pytest.approx(1.0)

    # Relevant doc at position 1 (0-indexed) out of 2
    ndcg = svc._ndcg(["x", "a"], {"a"}, 2)
    idcg = 1.0 / math.log2(2)
    dcg = 1.0 / math.log2(3)
    assert ndcg == pytest.approx(dcg / idcg)


# Need pytest for approx
import pytest
