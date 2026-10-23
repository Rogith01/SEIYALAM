
import json
import os
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from knowledge_base.gemini_service import (
    GeminiServiceError,
    generate_rag_answer,
)


class GeminiServiceTests(SimpleTestCase):
    def setUp(self):
        self.chunks = [
            {
                "id": 1,
                "document_id": 10,
                "title": "Employee Handbook",
                "chunk_index": 0,
                "text": "Employees receive 12 days of annual leave.",
            }
        ]

    def mock_gemini_response(self, payload):
        # MagicMock supports the context manager used by urlopen().
        response = MagicMock()
        response.read.return_value = json.dumps(payload).encode("utf-8")
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        return response

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"})
    @patch("knowledge_base.gemini_service.urlopen")
    def test_successful_gemini_response(self, mock_urlopen):
        mock_urlopen.return_value = self.mock_gemini_response(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": (
                                        "Employees receive 12 days "
                                        "of leave. [Source 1]"
                                    )
                                }
                            ]
                        }
                    }
                ]
            }
        )

        result = generate_rag_answer(
            question="How many leave days are provided?",
            chunks=self.chunks,
        )

        self.assertTrue(result["used_ai"])
        self.assertIn("12 days", result["answer"])
        self.assertEqual(len(result["sources"]), 1)
        self.assertEqual(
            result["sources"][0]["title"],
            "Employee Handbook",
        )
        mock_urlopen.assert_called_once()

    @patch.dict(os.environ, {}, clear=True)
    def test_no_chunks_returns_fallback_without_api_key(self):
        result = generate_rag_answer(
            question="What is the leave policy?",
            chunks=[],
        )

        self.assertFalse(result["used_ai"])
        self.assertEqual(result["sources"], [])
        self.assertIn(
            "couldn't find relevant information",
            result["answer"],
        )

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"})
    @patch("knowledge_base.gemini_service.urlopen")
    def test_empty_gemini_response_raises_service_error(self, mock_urlopen):
        mock_urlopen.return_value = self.mock_gemini_response({})

        with self.assertRaises(GeminiServiceError):
            generate_rag_answer(
                question="How many leave days are provided?",
                chunks=self.chunks,
            )

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"})
    @patch("knowledge_base.gemini_service.urlopen")
    def test_gemini_request_uses_api_key_header(self, mock_urlopen):
        mock_urlopen.return_value = self.mock_gemini_response(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {"text": "See the handbook. [Source 1]"}
                            ]
                        }
                    }
                ]
            }
        )

        generate_rag_answer(
            question="What does the handbook say?",
            chunks=self.chunks,
        )

        request = mock_urlopen.call_args.args[0]

        self.assertEqual(
            request.get_header("X-goog-api-key"),
            "test-key",
        )
        self.assertEqual(request.get_method(), "POST")
        self.assertIn("generateContent", request.full_url)
