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

CONTEXT:
{context}
{persona_adaptation}

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
    "check_for_understanding": "3 levels of questions: 1. Basic recall, 2. Application, 3. Critical thinking.",
    "common_misconceptions": "List 2-3 common mistakes students make about this topic and how to correct them.",
    "oral_questions": "3 discussion questions the teacher can ask the class to spark engagement."
}}

IMPORTANT GUIDELINES:
1. **STRICT LANGUAGE**: {lang_instruction}
2. **Depth over Brevity**: Provide detailed, meaningful content. Don't be too brief.
3. **Indian Context**: Use culturally relevant names, objects, and scenarios.
4. **Pedagogical Flow**: Ensure the content flows from simple to complex.
5. **Zero-Cost TLM**: Focus on things available in any government school.

Respond with ONLY the JSON object, no additional text."""

    return prompt
