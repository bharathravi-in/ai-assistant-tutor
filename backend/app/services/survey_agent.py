"""
Survey Agent Service
AI-powered survey generation based on teacher history and context
"""
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Query, User


class SurveyAgent:
    """AI agent for generating context-aware surveys"""
    
    async def generate_survey(
        self,
        db: AsyncSession,
        context: str,
        target_user_ids: Optional[List[int]] = None,
        num_questions: int = 5
    ) -> dict:
        """
        Generate a survey based on teacher history and provided context.
        
        Args:
            db: Database session
            context: What the survey should focus on
            target_user_ids: Specific teachers to analyze
            num_questions: Number of questions to generate
            
        Returns:
            Dictionary with title, description, and questions
        """
        # Gather teacher history for context
        teacher_insights = await self._analyze_teacher_history(db, target_user_ids)
        
        # Build prompt for LLM
        prompt = self._build_survey_prompt(context, teacher_insights, num_questions)
        
        # Generate survey using LLM
        try:
            from app.ai.llm_client import LLMClient
            llm = LLMClient()
            
            response = await llm.generate(
                prompt=prompt,
                system_message="You are an education expert helping create meaningful surveys for teachers. Generate surveys that will provide actionable insights for training improvement.",
                temperature=0.7
            )
            
            # Parse the response
            return self._parse_survey_response(response, context, num_questions)
            
        except Exception as e:
            # Fallback to template-based generation
            return self._generate_fallback_survey(context, num_questions)
    
    async def _analyze_teacher_history(
        self,
        db: AsyncSession,
        target_user_ids: Optional[List[int]] = None
    ) -> dict:
        """Analyze teacher query history for patterns"""
        query_filter = Query.mode.isnot(None)  # Get all queries
        
        if target_user_ids:
            query_filter = Query.user_id.in_(target_user_ids)
        
        result = await db.execute(
            select(Query)
            .where(query_filter)
            .order_by(Query.created_at.desc())
            .limit(100)
        )
        queries = result.scalars().all()
        
        # Extract patterns
        topics = {}
        challenges = []
        
        for q in queries:
            # Count topics by mode
            mode = q.mode.value if q.mode else "general"
            topics[mode] = topics.get(mode, 0) + 1
            
            # Collect challenge patterns from assist mode
            if q.mode and q.mode.value == "assist" and q.input_text:
                challenges.append(q.input_text[:200])
        
        return {
            "total_queries": len(queries),
            "topic_distribution": topics,
            "sample_challenges": challenges[:10],
            "teacher_count": len(set(q.user_id for q in queries))
        }
    
    def _build_survey_prompt(
        self,
        context: str,
        insights: dict,
        num_questions: int
    ) -> str:
        """Build the prompt for LLM survey generation"""
        return f"""Generate a professional survey for government school teachers based on the following:

CONTEXT: {context}

TEACHER INSIGHTS:
- Total queries analyzed: {insights['total_queries']}
- Teachers covered: {insights['teacher_count']}
- Topic distribution: {insights['topic_distribution']}
- Sample challenges: {', '.join(insights['sample_challenges'][:5])}

Generate exactly {num_questions} survey questions that will help understand:
1. Teacher training needs
2. Classroom implementation challenges
3. Resource gaps
4. Support requirements

For each question provide:
- question: The question text
- type: One of (text, rating, single_choice, multi_choice)
- options: For choice types, provide 4-5 relevant options
- required: true

Return as a JSON object with:
{{
    "title": "Survey title",
    "description": "Brief description",
    "questions": [list of question objects]
}}"""

    def _parse_survey_response(
        self,
        response: str,
        context: str,
        num_questions: int
    ) -> dict:
        """Parse LLM response into survey structure"""
        import json
        import re
        
        # Try to extract JSON from response
        try:
            # Find JSON block in response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                data = json.loads(json_match.group())
                return {
                    "title": data.get("title", f"Survey: {context[:50]}"),
                    "description": data.get("description", ""),
                    "questions": data.get("questions", [])[:num_questions]
                }
        except json.JSONDecodeError:
            pass
        
        # Fallback
        return self._generate_fallback_survey(context, num_questions)
    
    def _generate_fallback_survey(self, context: str, num_questions: int) -> dict:
        """Generate a template-based survey if AI fails"""
        base_questions = [
            {
                "question": f"How confident do you feel about implementing {context} in your classroom?",
                "type": "rating",
                "options": ["1", "2", "3", "4", "5"],
                "required": True
            },
            {
                "question": f"What challenges do you face with {context}?",
                "type": "text",
                "required": True
            },
            {
                "question": "How often do you need additional support?",
                "type": "single_choice",
                "options": ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
                "required": True
            },
            {
                "question": "What type of resources would help you most?",
                "type": "multi_choice",
                "options": [
                    "Video tutorials",
                    "Lesson plans",
                    "Activity worksheets",
                    "Peer discussions",
                    "Expert mentoring"
                ],
                "required": True
            },
            {
                "question": "Any additional feedback or suggestions?",
                "type": "text",
                "required": False
            }
        ]
        
        return {
            "title": f"Teacher Feedback Survey: {context[:50]}",
            "description": f"Help us understand your experience and needs related to {context}.",
            "questions": base_questions[:num_questions]
        }
