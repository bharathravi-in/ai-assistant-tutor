"""
Math Solver Agent - Specialized prompt for solving mathematical problems with step-by-step solutions.
Includes problem detection, solution generation, and verification.
"""
from typing import Optional


def is_math_problem(input_text: str) -> bool:
    """
    Detect if the input is a mathematical problem that needs to be solved.
    Returns True if the query appears to be a math problem requiring a solution.
    """
    text_lower = input_text.lower()
    
    # Direct math problem indicators
    solve_keywords = [
        'solve', 'find x', 'find the value', 'calculate', 'compute',
        'what is', 'evaluate', 'simplify', 'factorize', 'factorise',
        'find the answer', 'work out', 'determine', 'prove that'
    ]
    
    # Mathematical operators and patterns
    math_patterns = [
        '=', '+', '-', '*', '/', '^', '²', '³', '√',
        'x =', 'y =', 'solve for', '+ x', '- x', 
    ]
    
    # Check for equations (has = with variables)
    has_equation = '=' in input_text and any(var in text_lower for var in ['x', 'y', 'z', 'n', 'm'])
    
    # Check for solve keywords
    has_solve_keyword = any(keyword in text_lower for keyword in solve_keywords)
    
    # Check for mathematical expressions
    has_math_pattern = any(pattern in input_text for pattern in math_patterns)
    
    # Number-heavy text with operators
    import re
    has_math_expression = bool(re.search(r'\d+\s*[\+\-\*\/\^]\s*\d+', input_text))
    
    return has_equation or has_solve_keyword or (has_math_pattern and has_math_expression)


def get_math_solver_prompt(
    problem: str,
    language: str = "en",
    grade: Optional[int] = None,
    subject: Optional[str] = None,
) -> str:
    """
    Generate a prompt for solving a mathematical problem with detailed step-by-step solution.
    """
    
    context_parts = []
    if grade:
        context_parts.append(f"Student Grade Level: Class {grade}")
    if subject:
        context_parts.append(f"Subject: {subject}")
    
    context = "\n".join(context_parts) if context_parts else "General Mathematics"
    
    # Language instruction
    language_instruction = ""
    if language and language != "en":
        language_map = {
            "hi": "Hindi",
            "kn": "Kannada", 
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi",
            "gu": "Gujarati",
            "bn": "Bengali",
            "pa": "Punjabi"
        }
        lang_name = language_map.get(language, language)
        language_instruction = f"\n\nIMPORTANT: Respond entirely in {lang_name} language."
    
    prompt = f"""You are an expert mathematics teacher and problem solver. Your task is to solve the given mathematical problem with complete, clear, step-by-step working.

CONTEXT:
{context}

PROBLEM TO SOLVE:
{problem}

YOUR RESPONSE MUST BE A JSON OBJECT WITH EXACTLY THESE KEYS:

{{
    "problem_statement": "Restate the problem clearly, identifying what needs to be found",
    "problem_type": "Type of problem (e.g., 'Linear Equation', 'Quadratic Equation', 'Arithmetic', 'Geometry', 'Word Problem', etc.)",
    "given_information": "List all given values and facts from the problem",
    "solution_steps": [
        {{
            "step_number": 1,
            "action": "What mathematical operation or transformation are we doing",
            "working": "Show the actual mathematical working/equation",
            "result": "What we get after this step",
            "explanation": "Brief explanation of why this step works"
        }},
        // ... more steps as needed
    ],
    "final_answer": "The complete final answer, clearly stated",
    "verification": "Check: Substitute the answer back to verify it's correct",
    "concept_explanation": "Brief explanation of the mathematical concept(s) used in solving this problem",
    "common_mistakes": "List 1-2 common mistakes students make with this type of problem and how to avoid them",
    "similar_practice": "One similar practice problem for the student to try (without solution)"
}}{language_instruction}

GUIDELINES:
1. Show EVERY step clearly - do not skip any mathematical operation
2. Each step should be simple and easy to follow
3. Use proper mathematical notation
4. If it's a word problem, first translate it to mathematical form
5. Always verify the answer by substituting back
6. Explain concepts in simple terms suitable for the grade level
7. Be encouraging and supportive in your explanations

Respond with ONLY the JSON object, no additional text."""

    return prompt


def get_math_validator_prompt(
    problem: str,
    solution: str,
    final_answer: str,
) -> str:
    """
    Generate a prompt to validate a mathematical solution.
    Returns validation result with any corrections if needed.
    """
    
    prompt = f"""You are a mathematics verification expert. Your task is to carefully verify the following solution.

ORIGINAL PROBLEM:
{problem}

PROPOSED SOLUTION:
{solution}

CLAIMED ANSWER:
{final_answer}

Verify this solution by:
1. Checking if each step is mathematically correct
2. Checking if the final answer satisfies the original equation/problem
3. Checking for any calculation errors

YOUR RESPONSE MUST BE A JSON OBJECT:
{{
    "is_correct": true/false,
    "verification_steps": "Show your verification work",
    "errors_found": ["List any errors found, or empty array if correct"],
    "corrected_answer": "If incorrect, provide the correct answer",
    "confidence": "HIGH/MEDIUM/LOW - your confidence in this validation"
}}

Respond with ONLY the JSON object, no additional text."""

    return prompt
