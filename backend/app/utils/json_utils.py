
import json
import re

def repair_truncated_json(json_str: str) -> str:
    """
    Attempts to repair a truncated JSON string by closing unclosed brackets and quotes.
    """
    json_str = json_str.strip()
    if not json_str:
        return "{}"
    
    # 1. Handle unclosed quotes at the very end
    # Check if the last quote is a start quote without an end quote
    quotes_count = json_str.count('"') - json_str.count('\\"')
    if quotes_count % 2 != 0:
        json_str += '"'
    
    # 2. Handle missing closing braces/brackets
    stack = []
    in_quote = False
    escaped = False
    
    for i, char in enumerate(json_str):
        if char == '"' and not escaped:
            in_quote = not in_quote
        
        if not in_quote:
            if char == '{':
                stack.append('}')
            elif char == '[':
                stack.append(']')
            elif char == '}' or char == ']':
                if stack and stack[-1] == char:
                    stack.pop()
        
        if char == '\\':
            escaped = not escaped
        else:
            escaped = False
            
    # Close from inside out
    for closing_char in reversed(stack):
        json_str += closing_char
        
    return json_str

def extract_and_repair_json(text: str) -> dict:
    """
    Finds the first { and tries to parse everything until the end,
    repairing it if it's truncated.
    """
    if not text:
        return {}
        
    # Find the start of the JSON object
    start_idx = text.find('{')
    if start_idx == -1:
        return {}
        
    content = text[start_idx:]
    
    # Try parsing as is first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Try finding the last brace if it's not at the end
        end_idx = content.rfind('}')
        if end_idx != -1:
            try:
                return json.loads(content[:end_idx+1])
            except json.JSONDecodeError:
                pass
        
        # Try repairing
        repaired = repair_truncated_json(content)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            # If still failing, try a very aggressive approach for fields we care about
            return aggressive_extract(content)

def aggressive_extract(text: str) -> dict:
    """
    Extracts individual fields using regex if the whole JSON is irreparable.
    """
    fields = [
        "conceptual_briefing", "simple_explanation", "immediate_action", 
        "understanding", "what_to_say", "quick_activity", "mnemonics_hooks"
    ]
    result = {}
    for field in fields:
        # Match "field": "content" (handles multiline)
        pattern = rf'"{field}"\s*:\s*"(.*?)(?:"|\s*$)'
        match = re.search(pattern, text, re.DOTALL)
        if match:
            result[field] = match.group(1).strip()
    return result
