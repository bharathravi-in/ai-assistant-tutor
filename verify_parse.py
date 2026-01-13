
import sys
import os
import json

# Add backend to path
sys.path.append('/home/bharathr/self/projects/hackathon/Gov_Teaching/backend')

from app.services.ai_orchestrator import AIOrchestrator
from app.models.query import QueryMode

def test_parsing():
    orchestrator = AIOrchestrator()
    
    # 1. Triple Single Quote Case (Seen in user screenshot)
    response_triple = """'''json { "conceptual_briefing": "Newton's Third Law test" }'''"""
    print("Testing triple single quote response...")
    structured = orchestrator._parse_response(response_triple, QueryMode.EXPLAIN)
    print(f"Parsed keys: {list(structured.keys())}")
    assert "conceptual_briefing" in structured
    assert structured["conceptual_briefing"] == "Newton's Third Law test"

    # 2. Backtick Case
    response_backtick = """```json\n{ "simple_explanation": "Backtick test" }\n```"""
    print("\nTesting backtick response...")
    structured2 = orchestrator._parse_response(response_backtick, QueryMode.EXPLAIN)
    print(f"Parsed keys: {list(structured2.keys())}")
    assert "simple_explanation" in structured2

    # 3. Raw Braces Case
    response_raw = """Here is your answer: { "immediate_action": "Brace test" } Let me know if you need more."""
    print("\nTesting raw braces response...")
    structured3 = orchestrator._parse_response(response_raw, QueryMode.ASSIST)
    print(f"Parsed keys: {list(structured3.keys())}")
    assert "immediate_action" in structured3

    # 4. Fallback Case
    response_fail = "This is not JSON at all."
    print("\nTesting non-json response...")
    structured4 = orchestrator._parse_response(response_fail, QueryMode.EXPLAIN)
    print(f"Parsed keys: {list(structured4.keys())}")
    assert "raw_response" in structured4

    print("\nAll tests passed!")

if __name__ == "__main__":
    test_parsing()
