"""
Prompt templates for Explain/Teach mode
"""
from typing import Optional


def get_explain_prompt(
    question: str,
    language: str = "en",
    grade: Optional[int] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
) -> str:
    """
    Generate a prompt for explaining how to teach a concept.
    """
    
    context_parts = []
    if grade:
        context_parts.append(f"Grade Level: {grade}")
    if subject:
        context_parts.append(f"Subject: {subject}")
    if topic:
        context_parts.append(f"Topic: {topic}")
    
    context = "\n".join(context_parts) if context_parts else "General teaching"
    
    prompt = f"""You are an expert teaching coach helping a government school teacher in India. Your goal is to provide a comprehensive, engaging, and highly practical teaching guide.

CONTEXT:
{context}

TEACHER'S QUESTION:
{question}

STRUCTURE YOUR RESPONSE:
Provide a deep, structured response that helps the teacher not just answer a question, but teach it effectively.

Your response MUST be a JSON object with EXACTLY these keys:
{{
    "conceptual_briefing": "A high-level, clear overview of the topic for the teacher's own understanding. Explain the 'Why' behind this concept.",
    "simple_explanation": "A simplified version of the concept for students. Focus on clarity and removing technical jargon.",
    "mnemonics_hooks": "List 1-2 catchy words, mnemonics, or 'hooks' (e.g., a story start or a surprising fact) that will grab the students' attention immediately.",
    "what_to_say": "A scripted 'Teacher Talk' section. The exact words the teacher should use to introduce the topic.",
    "specific_examples": "3 concrete examples tailored specifically to a rural or semi-urban Indian context (e.g., using items found in a village, farming, local festivals).",
    "generic_examples": "2 general real-world examples that illustrate the concept's global application.",
    "visual_aid_idea": "Describe one simple drawing or object (TLM) the teacher can make/use with zero or low cost.",
    "check_for_understanding": "3 levels of questions: 1. Basic recall, 2. Application, 3. Critical thinking."
}}

IMPORTANT GUIDELINES:
1. **STRICT LANGUAGE**: Respond ONLY in {language}. Do NOT include Hindi translations unless specifically asked for.
2. **Depth over Brevity**: Provide detailed, meaningful content. Don't be too brief.
3. **Indian Context**: Use culturally relevant names, objects, and scenarios.
4. **Pedagogical Flow**: Ensure the content flows from simple to complex.
5. **Zero-Cost TLM**: Focus on things available in any government school.

Respond with ONLY the JSON object, no additional text."""

    return prompt
