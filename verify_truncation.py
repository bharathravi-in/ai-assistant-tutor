
import sys
import os
import json

# Add backend to path
sys.path.append('/home/bharathr/self/projects/hackathon/Gov_Teaching/backend')

from app.services.ai_orchestrator import AIOrchestrator
from app.models.query import QueryMode

def test_truncation_repair():
    orchestrator = AIOrchestrator()
    
    # User's exact truncated JSON (modified to be exactly what was pasted)
    response_truncated = """```json
{
    "conceptual_briefing": "Newton's third law of motion is a fundamental principle of symmetry in the universe. It states that forces are not isolated phenomena but are interactions between two different objects. For every force (the 'action') exerted by object A on object B, there is an equal and opposite force (the 'reaction') exerted by object B on object A. The 'Why' behind this law is that it's impossible for a single, isolated force to exist. A push or a pull always requires two participants. This law is crucial for understanding momentum conservation, propulsion, and why structures remain stable. A common point of confusion is why these forces don't cancel each other out; it's because the action and reaction forces act on *different* objects. The force of a horse pulling a cart acts on the cart, while the force of the cart pulling the horse acts on the horse. The cart moves because the horse's pull is greater than the friction acting on the cart.",
    "simple_explanation": "Imagine you are pushing a wall. You are putting a force on the wall. But have you noticed that you can also feel the wall pushing back on your hand? Newton's third law simply says that this always happens. For every push, there is an equal push back in the opposite direction. For every pull, there is an equal pull back. Forces always come in pairs, like two sides of the same coin. Nothing can ever give a push or a pull without getting an equal push or pull in return.",
    "mnemonics_hooks": [
        "The 'Push Me, Pull You' Rule: Every push gets a push back, and every pull gets a pull back.",
        "Hook: 'Why does your shoulder feel a kick when you throw a cricket ball with all your might? You are pushing the ball forward, so why do you feel a push backward? Today, we will solve this mystery using a law that is over 300 years old!'"
    ],
    "what_to_say": "“Good morning, everyone. Let's start with a little thought experiment. Imagine two friends"""

    print("Testing truncated response repair...")
    structured = orchestrator._parse_response(response_truncated, QueryMode.EXPLAIN)
    
    print(f"Parsed keys: {list(structured.keys())}")
    assert "conceptual_briefing" in structured
    assert "simple_explanation" in structured
    assert "mnemonics_hooks" in structured
    assert "what_to_say" in structured
    
    # Check if what_to_say was repaired (appended quote and braces)
    print(f"Repaired what_to_say: {structured['what_to_say'][:50]}...")
    
    formatted = orchestrator._format_explain(structured)
    print("\nFormatted Output (First 200 chars):")
    print(formatted[:200] + "...")
    
    assert "📖 **Conceptual Briefing**" in formatted
    assert "💡 **Simple Explanation**" in formatted
    
    print("\nTruncation repair test passed!")

if __name__ == "__main__":
    try:
        test_truncation_repair()
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
