
import re

from django.db.models import Q

from .models import DocumentChunk


# Common English words that usually add little value to keyword retrieval.
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "being",
    "but", "by", "can", "could", "did", "do", "does", "for",
    "from", "had", "has", "have", "he", "her", "here", "hers",
    "him", "his", "how", "i", "if", "in", "into", "is", "it",
    "its", "me", "my", "of", "on", "or", "our", "ours", "she",
    "so", "that", "the", "their", "them", "there", "these",
    "they", "this", "those", "to", "us", "was", "we", "were",
    "what", "when", "where", "which", "who", "why", "will",
    "with", "would", "you", "your", "yours",
}


def _extract_keywords(text):
    """Extract unique, useful keywords while preserving their order."""
    words = re.findall(r"\b[\w-]+\b", (text or "").lower())

    return list(
        dict.fromkeys(
            word
            for word in words
            if len(word) >= 2 and word not in STOP_WORDS
        )
    )


def retrieve_relevant_chunks(query, company_id, limit=5):
    """
    Retrieve relevant READY document chunks for one company.

    Uses keyword-based retrieval, not semantic/vector search.
    Returns the highest-scoring chunks, with deterministic tie-breaking.
    """
    query = (query or "").strip()

    if len(query) < 2 or not company_id:
        return []

    keywords = _extract_keywords(query)

    if not keywords:
        return []

    # Always scope retrieval to the requested company.
    chunks = DocumentChunk.objects.filter(
        company_id=company_id,
        document__status="READY",
    )

    # Use database filtering to narrow down possible matches.
    matching_chunks = chunks.filter(
        Q(text__icontains=keywords[0])
    )

    for keyword in keywords[1:]:
        matching_chunks = matching_chunks | chunks.filter(
            text__icontains=keyword
        )

    results = []

    for chunk in matching_chunks.select_related("document").distinct():
        # Match complete tokens instead of arbitrary substrings.
        chunk_keywords = set(_extract_keywords(chunk.text))
        matched_keywords = [
            keyword for keyword in keywords
            if keyword in chunk_keywords
        ]
        score = len(matched_keywords)

        if score == 0:
            continue

        results.append(
            {
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "title": chunk.document.title,
                "company_id": chunk.company_id,
                "chunk_index": chunk.chunk_index,
                "score": score,
                "text": chunk.text,
            }
        )

    # Highest score first; use title and chunk position to break ties.
    results.sort(
        key=lambda item: (
            -item["score"],
            item["title"].lower(),
            item["chunk_index"],
            item["chunk_id"],
        )
    )

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 5

    return results[:max(1, min(limit, 20))]
