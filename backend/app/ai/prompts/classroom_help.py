"""
Prompt templates for Classroom Implementation Help
Helps teachers when they face challenges while implementing lessons
"""
from typing import Optional


def get_classroom_help_prompt(
    challenge: str,
    grade: Optional[int] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    students_level: Optional[str] = None,
    language: str = "en",
    is_multigrade: bool = False,
    class_size: Optional[int] = None,
    instructional_time_minutes: Optional[int] = None,
) -> str:
    """
    Generate a prompt for classroom implementation help.
    """
    
    context_parts = []
    if grade:
        context_parts.append(f"Class/Grade: {grade}")
    if subject:
        context_parts.append(f"Subject: {subject}")
    if topic:
        context_parts.append(f"Topic being taught: {topic}")
    if students_level:
        context_parts.append(f"Students' current level: {students_level}")
    if is_multigrade:
        context_parts.append("Class Type: Multigrade (multiple grades in one room)")
    if class_size:
        context_parts.append(f"Class Size: {class_size} students")
    if instructional_time_minutes:
        context_parts.append(f"Remaining Time: {instructional_time_minutes} minutes")
    
    context = "\n".join(context_parts) if context_parts else "General classroom"
    
    prompt = f"""You are an experienced teaching mentor helping a government school teacher in India who is CURRENTLY IN THE CLASSROOM and needs IMMEDIATE help.

CLASSROOM CONTEXT:
{context}

TEACHER'S CHALLENGE:
{challenge}

Provide IMMEDIATE, ACTIONABLE guidance that the teacher can use RIGHT NOW.

Your response MUST be a JSON object with EXACTLY these keys:
{{
    "understanding": "Brief acknowledgment of the challenge (1 sentence)",
    "immediate_action": "What to do RIGHT NOW in the next 2-3 minutes. Be specific with exact words/steps.",
    "quick_activity": "A 5-10 minute activity or exercise to address this challenge. Include step-by-step instructions.",
    "bridge_the_gap": "How to connect what students already know to what they need to learn",
    "check_progress": "Quick way to check if students are improving (1-2 questions to ask)",
    "for_later": "One tip for next time to prevent this challenge"
}}

CRITICAL GUIDELINES:
1. Be PRACTICAL and IMMEDIATE - teacher is waiting with students
2. Assume LIMITED resources - no projector, maybe just chalk and board
3. Consider MIXED abilities in classroom (some students may understand, others don't)
4. Use SIMPLE language that can work in any Indian regional language
5. Include CONCRETE examples using familiar contexts (cricket, markets, farming, festivals)
6. If topic is academic (math, science), explain foundational prerequisites first

Respond with ONLY the JSON object, no additional text."""

    return prompt


def get_micro_learning_prompt(
    topic: str,
    grade: int,
    subject: str,
    duration_minutes: int = 5,
    language: str = "en",
) -> str:
    """
    Generate micro-learning content for teachers to quickly learn/review a topic
    before teaching it.
    """
    
    prompt = f"""You are an expert curriculum specialist creating MICRO-LEARNING content for a government school teacher in India.

REQUIREMENT:
- Topic: {topic}
- Grade level: Class {grade}
- Subject: {subject}
- Duration: {duration_minutes} minutes to read/learn

Create a quick, focused learning module that the teacher can use to:
1. Refresh their knowledge of this topic
2. Understand key concepts and common misconceptions
3. Get ready to teach effectively

Your response MUST be a JSON object with EXACTLY these keys:
{{
    "topic_summary": "2-3 sentence summary of the topic",
    "key_concepts": ["List of 3-5 key concepts to cover"],
    "common_misconceptions": ["2-3 mistakes students often make"],
    "prerequisite_check": "What students should already know before this topic",
    "teaching_sequence": [
        {{"step": 1, "what": "First thing to teach", "how": "Brief method", "time": "2 min"}},
        {{"step": 2, "what": "Second thing", "how": "Method", "time": "3 min"}}
    ],
    "simple_explanation": "How to explain this in simple words (use local language phrases if helpful)",
    "real_world_connection": "How this topic connects to students' daily life",
    "board_layout": "What to write on the board (brief)",
    "quick_assessment": "One question to check understanding"
}}

GUIDELINES:
1. Keep it BRIEF but COMPLETE
2. Focus on UNDERSTANDING, not rote learning
3. Use INDIAN context examples (markets, cricket, festivals, farming)
4. Assume BASIC teaching resources only
5. Make it PRACTICAL for mixed-ability classrooms

Respond with ONLY the JSON object, no additional text."""

    return prompt
