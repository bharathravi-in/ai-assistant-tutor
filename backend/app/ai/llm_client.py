"""
LLM Client - Abstraction layer for LLM providers
Supports multi-tenant organization-specific API keys
"""
from typing import Optional
from app.config import get_settings
from app.utils.encryption import decrypt_value

settings = get_settings()


class LLMClient:
    """
    Provider-agnostic LLM client.
    Supports OpenAI, Google Gemini, Anthropic, and LiteLLM.
    Can use organization-specific API keys for multi-tenant support.
    """
    
    def __init__(self, organization_settings=None, system_settings=None):
        """
        Initialize LLM client.
        
        Args:
            organization_settings: Optional OrganizationSettings object
            system_settings: Optional SystemSettings object
        """
        self.org_settings = organization_settings
        self.system_settings = system_settings
        self._client = None
        
        # Determine provider and API key
        if organization_settings:
            self.provider = organization_settings.ai_provider.value
            self._api_key = self._get_org_api_key()
            self._model = self._get_org_model()
        elif system_settings:
            self.provider = system_settings.ai_provider
            self._api_key = self._get_system_api_key()
            self._model = self._get_system_model()
        else:
            self.provider = settings.llm_provider.lower()
            self._api_key = self._get_env_api_key()
            self._model = self._get_default_model()
        
        self._init_client()
    
    def _get_org_api_key(self) -> Optional[str]:
        """Get API key from organization settings (decrypted)."""
        if not self.org_settings:
            return None
        
        if self.provider == "openai":
            encrypted = self.org_settings.openai_api_key
        elif self.provider == "gemini":
            encrypted = self.org_settings.gemini_api_key
        elif self.provider == "azure_openai":
            encrypted = self.org_settings.azure_openai_key
        elif self.provider == "anthropic":
            encrypted = self.org_settings.anthropic_api_key
        elif self.provider == "litellm":
            encrypted = self.org_settings.litellm_api_key
        else:
            return None
        
        return decrypt_value(encrypted) if encrypted else None
    
    def _get_org_model(self) -> str:
        """Get model name from organization settings."""
        if not self.org_settings:
            return self._get_default_model()
        
        if self.provider == "openai":
            return self.org_settings.openai_model or "gpt-4o-mini"
        elif self.provider == "gemini":
            return self.org_settings.gemini_model or "gemini-pro"
        elif self.provider == "azure_openai":
            return self.org_settings.azure_openai_deployment or "gpt-4"
        elif self.provider == "litellm":
            return self.org_settings.litellm_model or "gpt-4o-mini"
        else:
            return "gpt-4o-mini"

    def _get_system_api_key(self) -> Optional[str]:
        """Get API key from system settings (decrypted)."""
        if not self.system_settings:
            return None
        
        if self.provider == "openai":
            encrypted = self.system_settings.openai_api_key
        elif self.provider == "gemini":
            encrypted = self.system_settings.gemini_api_key
        elif self.provider == "azure_openai":
            encrypted = self.system_settings.azure_openai_key
        elif self.provider == "anthropic":
            encrypted = self.system_settings.anthropic_api_key
        elif self.provider == "litellm":
            encrypted = self.system_settings.litellm_api_key
        else:
            return None
        
        return decrypt_value(encrypted) if encrypted else None
    
    def _get_system_model(self) -> str:
        """Get model name from system settings."""
        if not self.system_settings:
            return self._get_default_model()
        
        if self.provider == "openai":
            return self.system_settings.openai_model or "gpt-4o-mini"
        elif self.provider == "gemini":
            return self.system_settings.gemini_model or "gemini-pro"
        elif self.provider == "azure_openai":
            return self.system_settings.azure_openai_deployment or "gpt-4"
        elif self.provider == "litellm":
            return self.system_settings.litellm_model or "gpt-4o-mini"
        else:
            return "gpt-4o-mini"
    
    def _get_env_api_key(self) -> Optional[str]:
        """Get API key from environment variables."""
        if self.provider == "openai":
            return settings.openai_api_key
        elif self.provider == "gemini":
            return settings.google_api_key
        elif self.provider == "anthropic":
            return settings.anthropic_api_key
        elif self.provider == "litellm":
            return settings.litellm_api_key
        return None
    
    def _get_default_model(self) -> str:
        """Get default model for provider."""
        if self.provider == "openai":
            return "gpt-4o-mini"
        elif self.provider == "gemini":
            return "gemini-pro"
        return "gpt-4o-mini"
    
    def _init_client(self):
        """Initialize the appropriate LLM client."""
        # Check if we have a valid API key
        if not self._api_key or self._api_key.startswith("your-"):
            # No valid API key, will use demo mode
            self._client = None
            return
        
        if self.provider == "openai":
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=self._api_key)
            except ImportError:
                raise ImportError("OpenAI package not installed. Run: pip install openai")
        
        elif self.provider == "gemini":
            try:
                import google.generativeai as genai
                genai.configure(api_key=self._api_key)
                self._client = genai.GenerativeModel(self._model)
            except ImportError:
                raise ImportError("Google AI package not installed. Run: pip install google-generativeai")
        
        elif self.provider == "azure_openai":
            try:
                from openai import AsyncAzureOpenAI
                endpoint = ""
                if self.org_settings and self.org_settings.azure_openai_endpoint:
                    endpoint = self.org_settings.azure_openai_endpoint
                elif self.system_settings and self.system_settings.azure_openai_endpoint:
                    endpoint = self.system_settings.azure_openai_endpoint
                
                self._client = AsyncAzureOpenAI(
                    api_key=self._api_key,
                    azure_endpoint=endpoint,
                    api_version="2024-02-15-preview"
                )
            except ImportError:
                raise ImportError("OpenAI package not installed. Run: pip install openai")
        
        elif self.provider == "anthropic":
            try:
                import anthropic
                self._client = anthropic.AsyncAnthropic(api_key=self._api_key)
            except ImportError:
                raise ImportError("Anthropic package not installed. Run: pip install anthropic")
        
        elif self.provider == "litellm":
            try:
                import litellm
                # Configure LiteLLM base URL if provided
                if self.org_settings and self.org_settings.litellm_base_url:
                    litellm.api_base = self.org_settings.litellm_base_url
                elif self.system_settings and self.system_settings.litellm_base_url:
                    litellm.api_base = self.system_settings.litellm_base_url
                elif settings.litellm_base_url:
                    litellm.api_base = settings.litellm_base_url
                
                if self._api_key:
                    litellm.api_key = self._api_key
                self._client = litellm
            except ImportError:
                raise ImportError("LiteLLM package not installed. Run: pip install litellm")
    
    async def generate(
        self,
        prompt: str,
        language: str = "en",
        max_tokens: int = 4000,
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
        # Check if client is available
        if self._client is None:
            return self._get_demo_response(prompt)
        
        # Add language instruction if not English
        if language != "en":
            lang_instruction = self._get_language_instruction(language)
            prompt = f"{lang_instruction}\n\n{prompt}"
        
        if self.provider == "openai":
            return await self._generate_openai(prompt, max_tokens, temperature)
        elif self.provider == "gemini":
            return await self._generate_gemini(prompt, max_tokens, temperature)
        elif self.provider == "azure_openai":
            return await self._generate_azure_openai(prompt, max_tokens, temperature)
        elif self.provider == "anthropic":
            return await self._generate_anthropic(prompt, max_tokens, temperature)
        elif self.provider == "litellm":
            return await self._generate_litellm(prompt, max_tokens, temperature)
        else:
            # Fallback: return a demo response
            return self._get_demo_response(prompt)
    
    async def _generate_openai(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate using OpenAI."""
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
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
    
    async def _generate_azure_openai(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate using Azure OpenAI."""
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
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
    
    async def _generate_anthropic(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate using Anthropic Claude."""
        try:
            response = await self._client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=max_tokens,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                system="You are an expert teaching assistant for government school teachers. Provide practical, actionable advice.",
            )
            return response.content[0].text
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _generate_litellm(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate using LiteLLM (provider-agnostic)."""
        try:
            # Determine base URL
            api_base = None
            if self.org_settings and self.org_settings.litellm_base_url:
                api_base = self.org_settings.litellm_base_url
            elif self.system_settings and self.system_settings.litellm_base_url:
                api_base = self.system_settings.litellm_base_url
            elif settings.litellm_base_url:
                api_base = settings.litellm_base_url
                
            # IMPORTANT: If a custom base URL is provided, we force litellm to treat it
            # as an OpenAI-style proxy to avoid automatic routing to Vertex/Google.
            extra_args = {}
            model_to_use = self._model
            
            if api_base:
                # Force it to use the proxy for specific models if needed
                # Prefixing with 'openai/' tells LiteLLM to use OpenAI-style calling
                if "gemini" in model_to_use.lower() and "/" not in model_to_use:
                    model_to_use = f"openai/{model_to_use}"
                
            response = await self._client.acompletion(
                model=model_to_use,
                messages=[
                    {"role": "system", "content": "You are an expert teaching assistant for government school teachers."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                api_key=self._api_key,
                api_base=api_base,
                **extra_args
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
    "simple_explanation": "This is a demo response. Configure your LLM provider (OpenAI/Gemini) to get real AI responses.",
    "what_to_say": "Ask your organization administrator to configure AI settings, or set API keys in the .env file.",
    "example_or_analogy": "Think of the AI assistant like a helpful colleague who needs proper credentials to access the knowledge base.",
    "check_for_understanding": "Have you configured your AI provider API keys?"
}
```"""
