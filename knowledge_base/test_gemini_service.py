
import json
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from knowledge_base.gemini_service import generate_rag_answer


class GeminiBusinessIntelligencePromptTests(SimpleTestCase):
    def setUp(self):
        self.live_context = (
            "LIVE BUSINESS INTELLIGENCE DATA\n"
            "Current work orders: 12\n"
            "Active work orders: 5\n"
            "Completed work orders: 7\n"
        )

        self.chunks = [
            {
                "content": self.live_context,
                "source_name": "Live Business Statistics",
                "title": "Live Business Statistics",
                "metadata": {
                    "type": "live_business_statistics",
                },
            }
        ]

        self.gemini_response = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "There are 12 work orders."}
                        ]
                    }
                }
            ]
        }

    def run_with_mocked_gemini(self, chunks):
        response = MagicMock()
        response.read.return_value = json.dumps(
            self.gemini_response
        ).encode("utf-8")
        response.__enter__.return_value = response
        response.__exit__.return_value = False

        with (
            patch.dict(
                "os.environ",
                {"GEMINI_API_KEY": "test-api-key"},
            ),
            patch(
                "knowledge_base.gemini_service._build_safe_history",
                return_value=[],
            ),
            patch(
                "knowledge_base.gemini_service._build_sources_and_context",
                return_value=(self.live_context, ["Live Business Statistics"])
                if chunks
                else ("", []),
            ),
            patch(
                "knowledge_base.gemini_service.urlopen",
                return_value=response,
            ) as mocked_urlopen,
        ):
            result = generate_rag_answer(
                question="How many work orders are there?",
                chunks=chunks,
                history=[],
            )

        return result, mocked_urlopen

    def test_prompt_prioritizes_live_business_statistics(self):
        result, mocked_urlopen = self.run_with_mocked_gemini(
            self.chunks
        )

        self.assertTrue(result["used_ai"])
        self.assertEqual(
            result["answer"],
            "There are 12 work orders.",
        )
        mocked_urlopen.assert_called_once()

        request = mocked_urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        prompt = payload["contents"][-1]["parts"][0]["text"]

        self.assertIn("LIVE BUSINESS INTELLIGENCE", prompt)
        self.assertIn("SOURCE PRIORITY AND USAGE", prompt)
        self.assertIn("COMPANY DOCUMENTS", prompt)
        self.assertIn("Do not invent, estimate", prompt)
        self.assertIn("12", prompt)

    def test_no_context_uses_general_conversation_prompt(self):
        result, mocked_urlopen = self.run_with_mocked_gemini([])

        self.assertTrue(result["used_ai"])
        mocked_urlopen.assert_called_once()

        request = mocked_urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        prompt = payload["contents"][-1]["parts"][0]["text"]

        self.assertIn(
            "No relevant company-document passages were found",
            prompt,
        )
        self.assertIn(
            "Never invent company-specific facts",
            prompt,
        )
        self.assertEqual(result["sources"], [])

class GeminiBusinessIntelligenceContextTests(SimpleTestCase):
    def test_live_business_statistics_reach_gemini_context(self):
        from knowledge_base.gemini_service import (
            _build_sources_and_context,
        )

        live_context = {
            "content": (
                "LIVE BUSINESS INTELLIGENCE DATA\n"
                '{"total_work_orders": 12, '
                '"active_work_orders": 5, '
                '"completed_work_orders": 7}'
            ),
            "source_name": "Live Business Statistics",
            "title": "Live Business Statistics",
            "company_id": 1,
            "metadata": {
                "type": "live_business_statistics",
                "company_id": "1",
            },
        }

        context, sources = _build_sources_and_context(
            [live_context]
        )

        self.assertIn("LIVE BUSINESS INTELLIGENCE DATA", context)
        self.assertIn('"total_work_orders": 12', context)
        self.assertIn('"active_work_orders": 5', context)
        self.assertIn('"completed_work_orders": 7', context)
        self.assertTrue(sources)
        self.assertEqual(
            sources[0]["name"],
            "Live Business Statistics",
        )
