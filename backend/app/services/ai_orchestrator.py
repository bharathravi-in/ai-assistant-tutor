"""
AI Orchestrator Service
Handles AI mode selection, prompt generation, and LLM interaction.
"""
import json
import re
from typing import Optional, Dict, Any
from app.config import get_settings
from app.models.query import QueryMode
from app.ai.prompts.explain import get_explain_prompt
from app.ai.prompts.assist import get_assist_prompt
from app.ai.prompts.plan import get_plan_prompt
from app.ai.prompts.quiz_agent import get_quiz_prompt
from app.ai.prompts.tlm_agent import get_tlm_prompt
from app.ai.prompts.ncert_agent import get_ncert_prompt
from app.ai.prompts.math_solver_agent import is_math_problem, get_math_solver_prompt
from app.ai.llm_client import LLMClient
from app.utils.json_utils import extract_and_repair_json

settings = get_settings()


class AIOrchestrator:
    """
    Orchestrates AI interactions for all three teaching modes:
    - Explain: How to teach a concept (includes math problem solving)
    - Assist: Classroom management help
    - Plan: Lesson planning
    """
    
    def __init__(self, organization_settings=None, system_settings=None):
        self.llm_client = LLMClient(
            organization_settings=organization_settings,
            system_settings=system_settings
        )
    
    async def process_request(
        self,
        mode: QueryMode,
        input_text: str,
        language: str = "en",
        grade: Optional[int] = None,
        subject: Optional[str] = None,
        topic: Optional[str] = None,
        context: Optional[str] = None,
        media_path: Optional[str] = None,
        is_multigrade: bool = False,
        class_size: Optional[int] = None,
        instructional_time_minutes: Optional[int] = None,
        persona: Optional[str] = "standard",
    ) -> Dict[str, Any]:
        """
        Process a teaching request through the appropriate AI mode.
        
        Returns:
            Dict with 'content' (formatted response) and 'structured' (parsed data)
        """
        # Check if this is a math problem that needs solving
        is_math = is_math_problem(input_text)
        
        # Select and build prompt based on mode
        if mode == QueryMode.EXPLAIN:
            if is_math:
                # Use specialized math solver for math problems
                prompt = get_math_solver_prompt(
                    problem=input_text,
                    language=language,
                    grade=grade,
                    subject=subject or "Mathematics",
                )
            else:
                # Regular explain prompt for concepts
                prompt = get_explain_prompt(
                    question=input_text,
                    language=language,
                    grade=grade,
                    subject=subject,
                    topic=topic,
                    is_multigrade=is_multigrade,
                    class_size=class_size,
                    instructional_time_minutes=instructional_time_minutes,
                    persona=persona,
                )
        elif mode == QueryMode.ASSIST:
            prompt = get_assist_prompt(
                situation=input_text,
                language=language,
                context=context,
                is_multigrade=is_multigrade,
                class_size=class_size,
                instructional_time_minutes=instructional_time_minutes,
            )
        elif mode == QueryMode.PLAN:
            prompt = get_plan_prompt(
                request=input_text,
                language=language,
                grade=grade,
                subject=subject,
                topic=topic,
                is_multigrade=is_multigrade,
                class_size=class_size,
                instructional_time_minutes=instructional_time_minutes,
            )
        else:
            raise ValueError(f"Unknown mode: {mode}")
        
        # Get response from LLM
        response = await self.llm_client.generate(prompt, language=language, media_path=media_path)
        
        # Parse structured response
        structured = self._parse_response(response, mode)
        
        # Format for display
        formatted = self._format_response(structured, mode, language)
        
        # Generate follow-up suggestions
        suggestions = self._generate_suggestions(mode, input_text)
        
        return {
            "content": formatted,
            "structured": structured,
            "suggestions": suggestions,
        }
    
    async def generate_quiz(
        self,
        topic: str,
        content: str,
        language: str = "en",
        level: str = "medium"
    ) -> Dict[str, Any]:
        """
        Specialized method to generate a quiz from lesson content.
        """
        prompt = get_quiz_prompt(
            topic=topic,
            content=content,
            language=language,
            level=level
        )
        
        response = await self.llm_client.generate(prompt, language=language)
        
        # Parse using the robust extraction logic
        structured = self._parse_response(response, None) # Mode None for raw extraction
        
        return structured
    
    async def generate_tlm(
        self,
        topic: str,
        content: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Specialized method to generate TLM (Visual/Physical) from lesson content.
        """
        prompt = get_tlm_prompt(
            topic=topic,
            content=content,
            language=language
        )
        
        response = await self.llm_client.generate(prompt, language=language)
        
        # Parse using the robust extraction logic
        structured = self._parse_response(response, None)
        
        return structured

    async def audit_content(
        self,
        topic: str,
        content: str,
        grade: Optional[int] = None,
        subject: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Audit teaching content for NCERT compliance.
        """
        prompt = get_ncert_prompt(
            topic=topic,
            content=content,
            grade=grade,
            subject=subject
        )

        response = await self.llm_client.generate(prompt)

        # Parse using the robust extraction logic
        structured = self._parse_response(response, None)

        return structured
    
    async def get_simple_answer(self, prompt: str, language: str = "en") -> str:
        """
        Get a simple text answer without parsing or structuring.
        Used for answering individual questions directly.
        Returns just the text response from the LLM.
        """
        response = await self.llm_client.generate(prompt, language=language)
        
        # Clean up any markdown code blocks that might be in the response
        if response:
            # Remove code blocks if present
            response = re.sub(r'```\w*\n?', '', response)
            response = response.strip()
        
        return response or "Unable to generate an answer."
    
    def _parse_response(self, response: str, mode: QueryMode) -> Dict[str, Any]:
        """Parse LLM response into structured format with EXTREME robust JSON extraction."""
        if not response:
            return {"raw_response": ""}

        # Clean the response string from any trailing/leading noise
        cleaned_response = response.strip()

        # Try multiple extraction strategies
        strategies = [
            # 1. Backtick JSON block
            r'```json\s*(.*?)\s*(?:```|$)',
            # 2. Triple single quote JSON block (seen in some Gemini responses)
            r"'''json\s*(.*?)\s*(?:'''|$)",
            # 3. Generic code block
            r'```\s*(.*?)\s*(?:```|$)',
            # 4. Raw braces (be greedy to capture full object)
            r'(\{.*\})'
        ]

        for pattern in strategies:
            match = re.search(pattern, cleaned_response, re.DOTALL)
            if match:
                json_str = match.group(1).strip()
                # Use repair utility for code block content
                try:
                    data = extract_and_repair_json(json_str)
                    if data: return data
                except: continue
        
        # Last ditch: try repair on the entire cleaned response
        try:
            data = extract_and_repair_json(cleaned_response)
            if data: return data
        except: pass
        
        # Fallback: return raw response
        return {"raw_response": response}
    
    def _format_response(self, structured: Dict[str, Any], mode: QueryMode, language: str) -> str:
        """Format structured response for display."""
        if "raw_response" in structured:
            return structured["raw_response"]
        
        if mode == QueryMode.EXPLAIN:
            return self._format_explain(structured)
        elif mode == QueryMode.ASSIST:
            return self._format_assist(structured)
        elif mode == QueryMode.PLAN:
            return self._format_plan(structured)
        
        return json.dumps(structured, indent=2, ensure_ascii=False)
    
    def _format_explain(self, data: Dict[str, Any]) -> str:
        """Format explain mode response using Phase 6 keys."""
        parts = []
        
        # Phase 6 keys
        if "conceptual_briefing" in data:
            parts.append(f"📖 **Conceptual Briefing**\n{data['conceptual_briefing']}")
        
        if "simple_explanation" in data:
            parts.append(f"💡 **Simple Explanation**\n{data['simple_explanation']}")
        
        if "mnemonics_hooks" in data:
            val = data["mnemonics_hooks"]
            if isinstance(val, list):
                parts.append("🔗 **Mnemonics & Hooks**\n" + "\n".join([f"• {v}" for v in val]))
            else:
                parts.append(f"🔗 **Mnemonics & Hooks**\n{val}")
            
        if "what_to_say" in data:
            parts.append(f"🗣️ **What to Say**\n{data['what_to_say']}")
            
        if "specific_examples" in data:
            examples = data["specific_examples"]
            if isinstance(examples, list):
                parts.append("🌳 **Contextual Examples**\n" + "\n".join([f"• {e}" for e in examples]))
            else:
                parts.append(f"🌳 **Contextual Examples**\n{examples}")

        if "generic_examples" in data:
            examples = data["generic_examples"]
            if isinstance(examples, list):
                parts.append("🌐 **Generic Examples**\n" + "\n".join([f"• {e}" for e in examples]))
            else:
                parts.append(f"🌐 **Generic Examples**\n{examples}")
                
        if "visual_aid_idea" in data:
            parts.append(f"🎨 **Visual Aid / TLM Idea**\n{data['visual_aid_idea']}")

        if "check_for_understanding" in data:
            check = data["check_for_understanding"]
            if isinstance(check, dict):
                check_parts = []
                for level, q in check.items():
                    check_parts.append(f"**{level.title()}**: {q}")
                parts.append("❓ **Check for Understanding**\n" + "\n".join(check_parts))
            else:
                parts.append(f"❓ **Check for Understanding**\n{check}")
        
        # Legacy key support
        if not parts:
            if "example_or_analogy" in data:
                parts.append(f"💡 **Example/Analogy**\n{data['example_or_analogy']}")
        
        return "\n\n".join(parts) if parts else json.dumps(data, indent=2, ensure_ascii=False)
    
    def _format_assist(self, data: Dict[str, Any]) -> str:
        """Format assist mode response using Phase 6 keys."""
        parts = []
        
        if "understanding" in data:
            parts.append(f"🤝 **Support**: {data['understanding']}")
        
        if "immediate_action" in data:
            parts.append(f"⚡ **Do This NOW**\n{data['immediate_action']}")
            
        if "mnemonics_hooks" in data:
            val = data["mnemonics_hooks"]
            if isinstance(val, list):
                parts.append("🔗 **Quick Hooks**\n" + "\n".join([f"• {v}" for v in val]))
            else:
                parts.append(f"🔗 **Quick Hook**\n{val}")
            
        if "quick_activity" in data:
            parts.append(f"🏸 **Quick Activity**\n{data['quick_activity']}")
            
        if "bridge_the_gap" in data:
            parts.append(f"🌉 **Bridge to Lesson**\n{data['bridge_the_gap']}")
            
        if "check_progress" in data:
            parts.append(f"📈 **Check Progress**\n{data['check_progress']}")
            
        if "for_later" in data:
            parts.append(f"🛡️ **For Tomorrow**\n{data['for_later']}")
            
        # Legacy keys
        if not parts:
            if "management_strategy" in data:
                parts.append(f"📋 **Management Strategy**\n{data['management_strategy']}")
            if "teaching_pivot" in data:
                parts.append(f"🔄 **Teaching Pivot**\n{data['teaching_pivot']}")
            if "fallback_option" in data:
                parts.append(f"🔙 **Fallback Option**\n{data['fallback_option']}")
        
        return "\n\n".join(parts) if parts else json.dumps(data, indent=2, ensure_ascii=False)
    
    def _format_plan(self, data: Dict[str, Any]) -> str:
        """Format plan mode response."""
        parts = []
        
        if "learning_objectives" in data:
            objectives = data["learning_objectives"]
            if isinstance(objectives, list):
                obj_list = "\n".join([f"• {obj}" for obj in objectives])
                parts.append(f"🎯 **Learning Objectives**\n{obj_list}")
        
        if "duration_minutes" in data:
            parts.append(f"⏱️ **Duration**: {data['duration_minutes']} minutes")
        
        if "activities" in data:
            activities = data["activities"]
            if isinstance(activities, list):
                act_text = []
                for i, act in enumerate(activities, 1):
                    name = act.get("activity_name", f"Activity {i}")
                    duration = act.get("duration_minutes", "?")
                    desc = act.get("description", "")
                    act_text.append(f"**{i}. {name}** ({duration} min)\n{desc}")
                parts.append(f"📝 **Activities**\n\n" + "\n\n".join(act_text))

        if "multi_grade_adaptations" in data:
            parts.append(f"🏫 **Multigrade Adaptations**\n{data['multi_grade_adaptations']}")

        if "low_tlm_alternatives" in data:
            parts.append(f"📦 **Low-TLM Alternatives**\n{data['low_tlm_alternatives']}")
        
        if "exit_questions" in data:
            questions = data["exit_questions"]
            if isinstance(questions, list):
                q_list = "\n".join([f"• {q}" for q in questions])
                parts.append(f"✅ **Exit Questions**\n{q_list}")
        
        return "\n\n".join(parts) if parts else json.dumps(data, indent=2, ensure_ascii=False)
    
    def _generate_suggestions(self, mode: QueryMode, input_text: str) -> list:
        """Generate follow-up suggestions based on mode."""
        if mode == QueryMode.EXPLAIN:
            return [
                "Would you like an activity to reinforce this concept?",
                "Need a simpler analogy for younger students?",
                "Want assessment questions for this topic?",
            ]
        elif mode == QueryMode.ASSIST:
            return [
                "Need help with a different classroom challenge?",
                "Want strategies for preventing this in the future?",
                "Would a quick energizer activity help?",
            ]
        elif mode == QueryMode.PLAN:
            return [
                "Need adaptations for different grade levels?",
                "Want low-resource alternatives?",
                "Need more assessment ideas?",
            ]
        return []
