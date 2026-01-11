"""
Prompt templates for Lesson Plan mode
"""
from typing import Optional


def get_plan_prompt(
    request: str,
    language: str = "en",
    grade: Optional[int] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
) -> str:
    """
    Generate a prompt for lesson planning.
    
    The AI will provide:
    - Learning objectives
    - Timed activities
    - Multi-grade adaptations
    - Low-TLM alternatives
    - Exit questions
    """
    
    context_parts = []
    if grade:
        context_parts.append(f"Grade Level: {grade}")
    if subject:
        context_parts.append(f"Subject: {subject}")
    if topic:
        context_parts.append(f"Topic: {topic}")
    
    context = "\n".join(context_parts) if context_parts else "General lesson"
    
    prompt = f"""You are an expert curriculum designer creating a lesson plan for a government school teacher in India.

CONTEXT:
{context}

TEACHER'S REQUEST:
{request}

Create a complete, practical lesson plan that can be implemented with minimal resources.

Your response MUST be a JSON object with EXACTLY these keys:
{{
    "learning_objectives": ["List 2-3 specific, measurable learning objectives"],
    "duration_minutes": 30,
    "activities": [
        {{
            "activity_name": "Name of activity",
            "duration_minutes": 5,
            "description": "Detailed step-by-step instructions",
            "materials_needed": ["List materials, or 'None' if no materials needed"]
        }}
    ],
    "multi_grade_adaptations": "How to adapt this lesson if teaching multiple grades simultaneously",
    "low_tlm_alternatives": "Alternatives if specific materials are not available",
    "exit_questions": ["2-3 questions to assess student learning at the end"]
}}

IMPORTANT GUIDELINES:
1. Total duration should be 30-45 minutes
2. Include at least 3-4 activities with variety (individual, pair, group work)
3. Assume minimal resources (chalk, blackboard, basic stationery)
4. Include engaging hooks and transitions
5. Consider diverse learner needs
6. Make activities culturally relevant to Indian context
7. Include at least one kinesthetic/movement-based activity
8. Build in formative assessment throughout

ACTIVITY TYPES TO INCLUDE:
- Warm-up/Hook (grab attention)
- Direct instruction (keep brief, max 10 min)
- Practice (individual or group)
- Application (real-world connection)
- Wrap-up/Exit ticket

Respond with ONLY the JSON object, no additional text."""

    return prompt
