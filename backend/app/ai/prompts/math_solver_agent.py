"""
Math Solver Agent - Specialized prompt for solving mathematical problems with step-by-step solutions.
Includes problem detection, solution generation, and verification.
"""
from typing import Optional


def is_math_problem(input_text: str) -> bool:
    """
    Detect if the input is a mathematical problem that needs to be solved.
    Returns True ONLY if the query is clearly a math problem requiring a solution.
    
    This function is conservative - when in doubt, returns False to avoid
    treating general knowledge questions as math problems.
    """
    import re
    text_lower = input_text.lower()
    
    # First, check for exclusion patterns - these indicate general knowledge, not math
    exclusion_patterns = [
        r'\bwhat is (\w+\s+){0,2}(a|an|the)\b',  # "what is a/an/the..." - definition questions
        r'\bwhat is \w+\s+(app|platform|portal|website|program|scheme|initiative|mission)\b',
        r'\bwho (is|was|are|were)\b',  # Person-related questions
        r'\bwhen (is|was|did)\b',  # Time-related questions  
        r'\bwhere (is|was|are)\b',  # Location-related questions
        r'\bwhy (is|do|does|did|are|was)\b',  # Reason-related questions
        r'\bhow (to|do|does|can|is|are)\b(?!.*\d)',  # How-to questions without numbers
        r'\bexplain\s+(the\s+)?(concept|meaning|definition|importance|significance)\b',
        r'\bwhat (is|are) (the\s+)?(meaning|definition|concept|use|purpose)\b',
        r'\btell me about\b',
        r'\bdefine\b',
        r'\bdescribe\b',
    ]
    
    for pattern in exclusion_patterns:
        if re.search(pattern, text_lower):
            # This looks like a general knowledge question, not math
            # But verify there are no actual math expressions
            if not re.search(r'\d+\s*[\+\-\*\/\^=]\s*\d+', input_text):
                return False
    
    # Check if text is too short or lacks numbers entirely for math problems
    # Most real math problems contain at least one number
    has_numbers = bool(re.search(r'\d+', input_text))
    
    # Direct math problem indicators - must be specific to math
    solve_keywords = [
        'solve', 'find x', 'find y', 'find the value', 'calculate', 'compute',
        'evaluate', 'simplify', 'factorize', 'factorise', 'expand',
        'find the answer', 'work out', 'determine the value', 'prove that',
        'find the root', 'find the solution', 'what is the value of',
        'integrate', 'differentiate', 'derive', 'sum of', 'difference of',
        'product of', 'divide', 'multiply', 'add', 'subtract'
    ]
    
    # Mathematical operators and patterns (require actual math content)
    equation_pattern = r'[xyz]\s*[\+\-\*\/\^=]\s*\d+|\d+\s*[\+\-\*\/\^=]\s*[xyz]'  # Variable equations
    pure_math_pattern = r'\d+\s*[\+\-\*\/\^]\s*\d+\s*[=\+\-\*\/]'  # Math expressions
    square_root_pattern = r'(√|sqrt)\s*\d+'  # Square roots
    power_pattern = r'\d+\s*[\^²³]|\d+\s*\*\*\s*\d+'  # Powers
    fraction_pattern = r'\d+/\d+'  # Fractions
    
    # Check for equations with variables (strong indicator)
    has_variable_equation = bool(re.search(equation_pattern, input_text, re.IGNORECASE))
    
    # Check for solve keywords
    has_solve_keyword = any(keyword in text_lower for keyword in solve_keywords)
    
    # Check for pure mathematical expressions
    has_math_expression = (
        bool(re.search(pure_math_pattern, input_text)) or
        bool(re.search(square_root_pattern, input_text)) or
        bool(re.search(power_pattern, input_text)) or
        bool(re.search(fraction_pattern, input_text))
    )
    
    # Decision logic:
    # 1. Variable equations are definitely math
    if has_variable_equation:
        return True
    
    # 2. Solve keywords + numbers = likely math
    if has_solve_keyword and has_numbers:
        return True
    
    # 3. Clear mathematical expressions
    if has_math_expression:
        return True
    
    # 4. "What is" only counts if followed by a number or math expression
    if 'what is' in text_lower:
        # "What is 5+3?" or "What is 25% of 100?"
        what_is_math = re.search(r'what is\s+[\d\.\,\+\-\*\/\^√%]', text_lower)
        if what_is_math:
            return True
    
    return False


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
