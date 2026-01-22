"""
LLM Client - Abstraction layer for LLM providers
Supports multi-tenant organization-specific API keys
"""
import os
from typing import Optional
from app.config import get_settings
from app.utils.encryption import decrypt_value


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
        # Get fresh settings each time
        self._settings = get_settings()
        
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
            # Use environment settings - check direct env vars as fallback
            self.provider = self._settings.llm_provider.lower() or os.getenv("LLM_PROVIDER", "openai").lower()
            self._api_key = self._get_env_api_key()
            self._model = self._get_env_model()
        
        print(f"[LLMClient] Initializing - provider: {self.provider}, model: {self._model}, has_key: {bool(self._api_key)}")
        
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
            return self._settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")
        elif self.provider == "gemini":
            return self._settings.google_api_key or os.getenv("GOOGLE_API_KEY", "")
        elif self.provider == "anthropic":
            return self._settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY", "")
        elif self.provider == "litellm":
            # Try multiple sources for LiteLLM API key
            key = self._settings.litellm_api_key or os.getenv("LITELLM_API_KEY", "")
            return key if key else None
        return None
    
    def _get_env_model(self) -> str:
        """Get model name from environment variables."""
        if self.provider == "openai":
            return os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        elif self.provider == "gemini":
            return os.getenv("GEMINI_MODEL", "gemini-pro")
        elif self.provider == "litellm":
            return self._settings.litellm_model or os.getenv("LITELLM_MODEL", "gpt-4o-mini")
        return self._get_default_model()
    
    def _get_default_model(self) -> str:
        """Get default model for provider."""
        if self.provider == "openai":
            return "gpt-4o-mini"
        elif self.provider == "gemini":
            return "gemini-pro"
        return "gpt-4o-mini"
    
    def _init_client(self):
        """Initialize the appropriate LLM client."""
        # For LiteLLM with base URL, we can proceed even with minimal key
        # as the proxy may handle authentication
        is_litellm_proxy = self.provider == "litellm" and (
            self._settings.litellm_base_url or os.getenv("LITELLM_BASE_URL", "")
        )
        
        # Check if we have a valid API key (unless using LiteLLM proxy)
        if not is_litellm_proxy:
            if not self._api_key or self._api_key.startswith("your-"):
                # No valid API key, will use demo mode
                print(f"[LLM] No valid API key for provider '{self.provider}', using demo mode")
                self._client = None
                return
        
        # For LiteLLM, proceed to initialize even if key validation is partial
        if self.provider == "litellm" and not self._api_key:
            self._api_key = os.getenv("LITELLM_API_KEY", "") or "default"
        
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
                # Configure LiteLLM base URL if provided - check all sources
                base_url = None
                if self.org_settings and self.org_settings.litellm_base_url:
                    base_url = self.org_settings.litellm_base_url
                elif self.system_settings and self.system_settings.litellm_base_url:
                    base_url = self.system_settings.litellm_base_url
                elif self._settings.litellm_base_url:
                    base_url = self._settings.litellm_base_url
                else:
                    base_url = os.getenv("LITELLM_BASE_URL", "")
                
                if base_url:
                    litellm.api_base = base_url
                    print(f"[LLM] LiteLLM configured with base URL: {base_url}")
                
                if self._api_key:
                    litellm.api_key = self._api_key
                
                self._client = litellm
                print(f"[LLM] LiteLLM client initialized successfully, model: {self._model}")
            except ImportError:
                print("[LLM] LiteLLM package not installed")
                self._client = None
    
    async def generate(
        self,
        prompt: str,
        language: str = "en",
        max_tokens: int = 4000,
        temperature: float = 0.7,
        media_path: Optional[str] = None
    ) -> str:
        """
        Generate a response from the LLM.
        
        Args:
            prompt: The prompt to send to the LLM
            language: Response language preference
            max_tokens: Maximum tokens in response
            temperature: Creativity parameter (0-1)
            media_path: Optional path to a media file (image/document)
        
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
            return await self._generate_gemini(prompt, max_tokens, temperature, media_path)
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
    
    async def _generate_gemini(self, prompt: str, max_tokens: int, temperature: float, media_path: Optional[str] = None) -> str:
        """Generate using Google Gemini."""
        try:
            import google.generativeai as genai
            
            content_parts = [prompt]
            
            if media_path:
                # media_path could be like /uploads/voice/filename.webm or /uploads/filename.jpg
                filename = media_path.split("/")[-1]
                
                # Try common locations
                possible_paths = [
                    os.path.join("uploads", filename),
                    os.path.join("uploads", "voice", filename),
                    os.path.join("uploads", "voices", filename),
                    os.path.join("/app/uploads", filename),
                    os.path.join("/app/uploads/voice", filename),
                    # Direct path if it's already absolute or relative and exists
                    media_path.lstrip("/"),
                    media_path
                ]
                
                actual_path = None
                for path in possible_paths:
                    if os.path.exists(path) and os.path.isfile(path):
                        actual_path = path
                        break
                
                if actual_path:
                    # Upload and add to content parts
                    uploaded_file = genai.upload_file(path=actual_path)
                    content_parts.append(uploaded_file)
                else:
                    print(f"Warning: Media file not found for Gemini: {media_path}")
            
            response = await self._client.generate_content_async(
                content_parts,
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
            # Determine base URL - check all sources including os.getenv
            api_base = None
            if self.org_settings and self.org_settings.litellm_base_url:
                api_base = self.org_settings.litellm_base_url
            elif self.system_settings and self.system_settings.litellm_base_url:
                api_base = self.system_settings.litellm_base_url
            elif self._settings.litellm_base_url:
                api_base = self._settings.litellm_base_url
            else:
                api_base = os.getenv("LITELLM_BASE_URL", "")
                
            # IMPORTANT: If a custom base URL is provided, we force litellm to treat it
            # as an OpenAI-style proxy to avoid automatic routing to Vertex/Google.
            model_to_use = self._model
            
            if api_base:
                # Force it to use the proxy for specific models if needed
                # Prefixing with 'openai/' tells LiteLLM to use OpenAI-style calling
                if "gemini" in model_to_use.lower() and "/" not in model_to_use:
                    model_to_use = f"openai/{model_to_use}"
            
            print(f"[LLM] Generating with LiteLLM - model: {model_to_use}, base: {api_base}")
            
            response = await self._client.acompletion(
                model=model_to_use,
                messages=[
                    {"role": "system", "content": "You are an expert teaching assistant for government school teachers."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                api_key=self._api_key,
                api_base=api_base if api_base else None,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[LLM] Error in LiteLLM generation: {str(e)}")
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
