
import re

from .models import DocumentChunk


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
    Retrieve READY document chunks for one company.
    Rank chunks by the number of query keywords they contain.
    """
    query = (query or "").strip()

    if len(query) < 2 or not company_id:
        return []

    keywords = _extract_keywords(query)

    if not keywords:
        return []

    chunks = (
        DocumentChunk.objects.filter(
            company_id=company_id,
            document__status="READY",
        )
        .select_related("document")
    )

    results = []

    # Match keywords in Python instead of relying on database icontains.
    for chunk in chunks.iterator():
        chunk_keywords = set(_extract_keywords(chunk.text))

        matched_keywords = [
            keyword for keyword in keywords
            if keyword in chunk_keywords
        ]

        score = len(matched_keywords)

        if score == 0:
            continue

        results.append({
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "title": chunk.document.title,
            "company_id": chunk.company_id,
            "chunk_index": chunk.chunk_index,
            "score": score,
            "text": chunk.text,
        })

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
