"""
AI Orchestrator Service
Handles AI mode selection, prompt generation, and LLM interaction.
"""
import json
from typing import Optional, Dict, Any
from app.config import get_settings
from app.models.query import QueryMode
from app.ai.prompts.explain import get_explain_prompt
from app.ai.prompts.assist import get_assist_prompt
from app.ai.prompts.plan import get_plan_prompt
from app.ai.llm_client import LLMClient

settings = get_settings()


class AIOrchestrator:
    """
    Orchestrates AI interactions for all three teaching modes:
    - Explain: How to teach a concept
    - Assist: Classroom management help
    - Plan: Lesson planning
    """
    
    def __init__(self):
        self.llm_client = LLMClient()
    
    async def process_request(
        self,
        mode: QueryMode,
        input_text: str,
        language: str = "en",
        grade: Optional[int] = None,
        subject: Optional[str] = None,
        topic: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process a teaching request through the appropriate AI mode.
        
        Returns:
            Dict with 'content' (formatted response) and 'structured' (parsed data)
        """
        # Select and build prompt based on mode
        if mode == QueryMode.EXPLAIN:
            prompt = get_explain_prompt(
                question=input_text,
                language=language,
                grade=grade,
                subject=subject,
                topic=topic,
            )
        elif mode == QueryMode.ASSIST:
            prompt = get_assist_prompt(
                situation=input_text,
                language=language,
                context=context,
            )
        elif mode == QueryMode.PLAN:
            prompt = get_plan_prompt(
                request=input_text,
                language=language,
                grade=grade,
                subject=subject,
                topic=topic,
            )
        else:
            raise ValueError(f"Unknown mode: {mode}")
        
        # Get response from LLM
        response = await self.llm_client.generate(prompt, language=language)
        
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
    
    def _parse_response(self, response: str, mode: QueryMode) -> Dict[str, Any]:
        """Parse LLM response into structured format."""
        # Try to extract JSON from response
        try:
            # Look for JSON block in response
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
                return json.loads(json_str)
            elif "{" in response:
                # Try to find JSON object
                json_start = response.find("{")
                json_end = response.rfind("}") + 1
                json_str = response[json_start:json_end]
                return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            pass
        
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
        """Format explain mode response."""
        parts = []
        
        if "simple_explanation" in data:
            parts.append(f"📚 **Simple Explanation**\n{data['simple_explanation']}")
        
        if "what_to_say" in data:
            parts.append(f"💬 **What to Say to Students**\n{data['what_to_say']}")
        
        if "example_or_analogy" in data:
            parts.append(f"💡 **Example/Analogy**\n{data['example_or_analogy']}")
        
        if "check_for_understanding" in data:
            parts.append(f"❓ **Check for Understanding**\n{data['check_for_understanding']}")
        
        return "\n\n".join(parts) if parts else json.dumps(data, indent=2, ensure_ascii=False)
    
    def _format_assist(self, data: Dict[str, Any]) -> str:
        """Format assist mode response."""
        parts = []
        
        if "immediate_action" in data:
            parts.append(f"⚡ **Do This NOW (Next 2-5 mins)**\n{data['immediate_action']}")
        
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
