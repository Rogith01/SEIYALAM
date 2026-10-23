
from functools import lru_cache

from sentence_transformers import SentenceTransformer, util

from .models import DocumentChunk


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def _get_embedding_model():
    """Load the local embedding model once per Python process."""
    return SentenceTransformer(MODEL_NAME)


def retrieve_semantic_chunks(query, company_id, limit=5):
    """
    Retrieve semantically similar READY document chunks for one company.

    This prototype calculates chunk embeddings at query time.
    It does not store embeddings or modify the database schema.
    """
    query = (query or "").strip()

    if len(query) < 2 or not company_id:
        return []

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 5

    limit = max(1, min(limit, 20))

    # Enforce company isolation before any text is embedded.
    chunks = list(
        DocumentChunk.objects.filter(
            company_id=company_id,
            document__status="READY",
        )
        .select_related("document")
        .order_by("document__title", "chunk_index", "id")
    )

    if not chunks:
        return []

    model = _get_embedding_model()

    query_embedding = model.encode(
        query,
        convert_to_tensor=True,
        normalize_embeddings=True,
    )

    chunk_embeddings = model.encode(
        [chunk.text for chunk in chunks],
        convert_to_tensor=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    similarities = util.cos_sim(
        query_embedding,
        chunk_embeddings,
    )[0]

    ranked_indices = sorted(
        range(len(chunks)),
        key=lambda index: (
            -float(similarities[index]),
            chunks[index].document.title.lower(),
            chunks[index].chunk_index,
            chunks[index].id,
        ),
    )

    results = []

    for index in ranked_indices[:limit]:
        chunk = chunks[index]

        results.append(
            {
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "title": chunk.document.title,
                "company_id": chunk.company_id,
                "chunk_index": chunk.chunk_index,
                "score": round(float(similarities[index]), 4),
                "text": chunk.text,
            }
        )

    return results
