import os
import asyncio
from typing import Optional
from app.ai.llm_client import LLMClient
from app.config import get_settings

settings = get_settings()

class TranscriptionService:
    """Service for transcribing audio notes and analyzing pedagogical sentiment."""
    
    def __init__(self):
        self.llm_client = LLMClient()
        
    async def transcribe_audio(self, voice_url: str) -> Optional[str]:
        """
        Transcribe audio file using AI.
        
        Args:
            voice_url: Relative URL to the voice note (e.g., /uploads/voice/filename.webm)
        """
        # Gemini can handle audio files directly if they are uploaded or passed as content
        # We'll use the LLMClient's capability
        
        prompt = """
        TRANSCRIPTION TASK:
        Please transcribe the attached audio note exactly as spoken. 
        - Maintain the original language (e.g. if spoken in Hindi, transcribe in Hindi script).
        - If there are multiple speakers, label them as Speaker 1, Speaker 2, etc.
        - Do not summarize. Provide the full text.
        """
        
        try:
            # We pass the voice_url which LLMClient will try to resolve
            transcript = await self.llm_client.generate(
                prompt=prompt,
                media_path=voice_url
            )
            
            # Basic cleanup of the response
            if transcript.startswith("Error generating response"):
                return None
                
            return transcript.strip()
        except Exception as e:
            print(f"Transcription error: {str(e)}")
            return None

    async def analyze_pedagogical_sentiment(self, transcript: str) -> dict:
        """
        Analyze the tone and pedagogical value of a teacher's reflection.
        """
        prompt = f"""
        Analyze the following teacher reflection transcript for pedagogical sentiment and classroom reality:
        
        TRANSCRIPT:
        {transcript}
        
        Provide a JSON response with:
        1. "sentiment": (positive/neutral/frustrated/overwhelmed)
        2. "key_challenges": List of specific classroom problems mentioned
        3. "students_reaction": How students responded according to the teacher
        4. "support_needed": Specific help the teacher seems to need
        5. "confidence_level": (high/medium/low) based on their tone
        """
        
        response = await self.llm_client.generate(prompt=prompt)
        
        # Parse JSON
        import json
        import re
        try:
            # Extract JSON from potential markdown
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return {"raw_analysis": response}
        except:
            return {"raw_analysis": response}
