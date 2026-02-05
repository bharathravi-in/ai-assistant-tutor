"""
Prompt templates for Explain/Teach mode
"""
from typing import Optional


# Persona adaptation instructions
PERSONA_INSTRUCTIONS = {
    "standard": "",
    "slow_learner": """
ADAPTATION FOR SLOW LEARNER:
- Use shorter sentences with simple vocabulary
- Repeat key concepts in different ways
- Break down complex ideas into smaller steps
- Add more concrete, hands-on examples
- Use encouraging and patient tone
- Include memory aids and repetition""",
    "visual_learner": """
ADAPTATION FOR VISUAL LEARNER:
- Emphasize diagrams, charts, and visual representations
- Describe step-by-step drawing instructions
- Use color-coding suggestions
- Include "picture this" type descriptions
- Reference visual patterns and spatial relationships""",
    "first_gen": """
ADAPTATION FOR FIRST-GENERATION LEARNER:
- Provide extra context and background knowledge
- Never assume prior exposure to concepts
- Connect to everyday village/home experiences
- Use mother-tongue friendly explanations
- Build from the most basic level up""",
    "exam_focused": """
ADAPTATION FOR EXAM-FOCUSED STUDENT:
- Highlight key points likely to appear in exams
- Include common question patterns
- Add "Important for exam" markers
- Provide answer formats and templates
- Include practice questions with marking schemes"""
}


def get_explain_prompt(
    question: str,
    language: str = "en",
    grade: Optional[int] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    is_multigrade: bool = False,
    class_size: Optional[int] = None,
    instructional_time_minutes: Optional[int] = None,
    persona: Optional[str] = "standard",
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
    if is_multigrade:
        context_parts.append("Class Type: Multigrade (multiple grades in one room)")
    if class_size:
        context_parts.append(f"Class Size: {class_size} students")
    if instructional_time_minutes:
        context_parts.append(f"Instructional Time: {instructional_time_minutes} minutes")
    
    context = "\n".join(context_parts) if context_parts else "General teaching"
    
    # Get persona-specific instructions
    persona_adaptation = PERSONA_INSTRUCTIONS.get(persona or "standard", "")
    
    # Language instruction
    lang_map = {"en": "English", "hi": "Hindi", "kn": "Kannada", "te": "Telugu", "mixed": "Mix of English and local language (Hindi/regional)"}
    target_lang = lang_map.get(language, "English")
    lang_instruction = f"Respond ONLY in {target_lang}."
    if language == "mixed":
        lang_instruction = "Use a natural mix of English for technical terms and Hindi/regional language for explanations."
    
    prompt = f"""You are an expert teaching coach helping a government school teacher in India. Your goal is to provide a comprehensive, engaging, and highly practical teaching guide.
    
    IMPORTANT: {lang_instruction} Even if you are providing 'Indian Context' examples, names, or scenarios, they must be written in {target_lang}. Do NOT drift into other languages.

CONTEXT:
{context}
{persona_adaptation}

TEACHER'S QUESTION:
{question}

STRUCTURE YOUR RESPONSE:
Provide a deep, structured response that helps the teacher not just answer a question, but teach it effectively.

Your response MUST be a JSON object with EXACTLY these keys and formats:
{{
    "conceptual_briefing": "string - high-level overview for teacher",
    "simple_explanation": "string - simple version for students",
    "mnemonics_hooks": [
        {{"type": "Mnemonic/Hook", "content": "string"}}
    ],
    "what_to_say": "string - scripted scripted talk",
    "specific_examples": [
        {{"title": "string", "description": "string (Indian context)"}}
    ],
    "generic_examples": [
        {{"title": "string", "description": "string"}}
    ],
    "visual_aid_idea": {{
        "title": "A descriptive name for the visual aid",
        "materials": "List of low-cost/no-cost materials needed",
        "instructions": "Step-by-step guide for the teacher to create/use it",
        "usage": "How this specific aid helps explain the concept"
    }},
    "check_for_understanding": [
        {{"level": "Basic Recall", "question": "string"}},
        {{"level": "Application", "question": "string"}},
        {{"level": "Critical Thinking", "question": "string"}}
    ],
    "common_misconceptions": [
        {{"misconception": "string", "correction": "string"}}
    ],
    "oral_questions": ["string", "string", "string"]
}}

IMPORTANT GUIDELINES:
1. **STRICT JSON STRUCTURE**: Respond ONLY with the JSON object at the top level. Do NOT wrap it in a "sections", "response", or "data" key.
2. **STRICT LANGUAGE**: {lang_instruction} This applies to ALL content, including examples and names.
3. **Visual Aid Detail**: The `visual_aid_idea` MUST be descriptive and actionable. Do not leave fields empty.
4. **Depth over Brevity**: Provide detailed, meaningful content. Don't be too brief.
5. **Indian Context**: Use culturally relevant names, objects, and scenarios, but describe them entirely in {target_lang}.
6. **Pedagogical Flow**: Ensure the content flows from simple to complex.
7. **Zero-Cost TLM**: Focus on things available in any government school.

Respond with ONLY the JSON object, no additional text."""

    return prompt
