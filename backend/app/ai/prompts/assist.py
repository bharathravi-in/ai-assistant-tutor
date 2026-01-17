"""
Prompt templates for Classroom Assist mode
"""
from typing import Optional


def get_assist_prompt(
    situation: str,
    language: str = "en",
    context: Optional[str] = None,
    is_multigrade: bool = False,
    class_size: Optional[int] = None,
    instructional_time_minutes: Optional[int] = None,
) -> str:
    """
    Generate a prompt for classroom management assistance.
    """
    
    context_parts = []
    if context:
        context_parts.append(f"Additional Context: {context}")
    if is_multigrade:
        context_parts.append("Class Type: Multigrade (multiple grades in one room)")
    if class_size:
        context_parts.append(f"Class Size: {class_size} students")
    if instructional_time_minutes:
        context_parts.append(f"Remaining Time: {instructional_time_minutes} minutes")
        
    additional_context = "\n".join(context_parts) if context_parts else ""
    
    prompt = f"""You are an experienced classroom management expert helping a government school teacher in India. The teacher is facing a REAL-TIME classroom challenge and needs IMMEDIATE, practical guidance.

CURRENT SITUATION:
{situation}
{additional_context}

YOUR GOAL:
Provide a structured, supportive, and immediately implementable plan to resolve the situation and redirection the class toward learning.

Your response MUST be a JSON object with EXACTLY these keys:
{{
    "understanding": "A short, empathetic sentence showing you understand the teacher's current challenge.",
    "immediate_action": "A specific action the teacher can take RIGHT NOW in the next 2 minutes. Be extremely concrete.",
    "mnemonics_hooks": "A catchy phrase, signal, or quick hook (e.g., a hand signal or a call-and-response) to grab attention immediately.",
    "quick_activity": "A 5-minute engaging activity to reset the class energy or redirect focused attention.",
    "bridge_the_gap": "How to transition from the disruption back to the lesson topic ({context if context else 'the current lesson'}).",
    "check_progress": "A quick way to check if the class has settled down and is ready to proceed.",
    "for_later": "One short tip on how to prevent this specific issue from happening tomorrow."
}}

IMPORTANT GUIDELINES:
1. **STRICT LANGUAGE**: Respond ONLY in {language}. Do NOT include Hindi translations unless specifically asked for.
2. **Immediate & Actionable**: No preparation or tools needed.
3. **Indian Context**: Respectful, authoritative but friendly, suitable for large Indian government school classrooms.
4. **Behavioral Focus**: Positive redirection over punishment.
5. **Clear & Direct**: No fluff, just guidance.

Respond with ONLY the JSON object, no additional text."""

    return prompt
