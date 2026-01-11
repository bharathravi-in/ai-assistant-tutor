"""
LLM Client - Abstraction layer for LLM providers
"""
from typing import Optional
from app.config import get_settings

settings = get_settings()


class LLMClient:
    """
    Provider-agnostic LLM client.
    Supports OpenAI, Google Gemini, and LiteLLM.
    """
    
    def __init__(self):
        self.provider = settings.llm_provider.lower()
        self._client = None
        self._init_client()
    
    def _init_client(self):
        """Initialize the appropriate LLM client."""
        if self.provider == "openai":
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=settings.openai_api_key)
            except ImportError:
                raise ImportError("OpenAI package not installed. Run: pip install openai")
        
        elif self.provider == "gemini":
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.google_api_key)
                self._client = genai.GenerativeModel('gemini-pro')
            except ImportError:
                raise ImportError("Google AI package not installed. Run: pip install google-generativeai")
        
        elif self.provider == "litellm":
            try:
                import litellm
                self._client = litellm
            except ImportError:
                raise ImportError("LiteLLM package not installed. Run: pip install litellm")
    
    async def generate(
        self,
        prompt: str,
        language: str = "en",
        max_tokens: int = 2000,
        temperature: float = 0.7,
    ) -> str:
        """
        Generate a response from the LLM.
        
        Args:
            prompt: The prompt to send to the LLM
            language: Response language preference
            max_tokens: Maximum tokens in response
            temperature: Creativity parameter (0-1)
        
        Returns:
            Generated text response
        """
        # Add language instruction if not English
        if language != "en":
            lang_instruction = self._get_language_instruction(language)
            prompt = f"{lang_instruction}\n\n{prompt}"
        
        if self.provider == "openai":
            return await self._generate_openai(prompt, max_tokens, temperature)
        elif self.provider == "gemini":
            return await self._generate_gemini(prompt, max_tokens, temperature)
        elif self.provider == "litellm":
            return await self._generate_litellm(prompt, max_tokens, temperature)
        else:
            # Fallback: return a demo response
            return self._get_demo_response(prompt)
    
    async def _generate_openai(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate using OpenAI."""
        try:
            response = await self._client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert teaching assistant for government school teachers. Provide practical, actionable advice that can be implemented immediately in the classroom."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _generate_gemini(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate using Google Gemini."""
        try:
            response = await self._client.generate_content_async(
                prompt,
                generation_config={
                    "max_output_tokens": max_tokens,
                    "temperature": temperature,
                }
            )
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _generate_litellm(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate using LiteLLM (provider-agnostic)."""
        try:
            response = await self._client.acompletion(
                model="gpt-4o-mini",  # Can be configured
                messages=[
                    {"role": "system", "content": "You are an expert teaching assistant for government school teachers."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def _get_language_instruction(self, language: str) -> str:
        """Get language instruction for the prompt."""
        language_names = {
            "hi": "Hindi (हिंदी)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
            "kn": "Kannada (ಕನ್ನಡ)",
            "mr": "Marathi (मराठी)",
        }
        lang_name = language_names.get(language, language)
        return f"IMPORTANT: Please respond in {lang_name}. Use the local script."
    
    def _get_demo_response(self, prompt: str) -> str:
        """Return a demo response when no LLM is configured."""
        return """```json
{
    "simple_explanation": "This is a demo response. Configure your LLM provider in .env to get real AI responses.",
    "what_to_say": "To get started, set your OPENAI_API_KEY or GOOGLE_API_KEY in the .env file.",
    "example_or_analogy": "Think of the AI assistant like a helpful colleague who is always available.",
    "check_for_understanding": "Can you configure an API key and try again?"
}
```"""
