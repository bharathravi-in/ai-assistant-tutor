"""
LLM Client - Abstraction layer for LLM providers
Supports multi-tenant organization-specific API keys
"""
import os
import asyncio
from typing import Optional
from app.config import get_settings
from app.utils.encryption import decrypt_value


class LLMClient:
    """
    Provider-agnostic LLM client.
    Supports OpenAI, Google Gemini, Anthropic, and LiteLLM.
    Can use organization-specific API keys for multi-tenant support.
    """
    
    def __init__(
        self, 
        provider: Optional[str] = None, 
        model: Optional[str] = None, 
        system_settings = None,
        organization_settings = None
    ):
        """
        Initialize LLM Client.
        
        Args:
            provider: LLM provider (openai, gemini, etc.)
            model: Model name to use
            system_settings: Optional SystemSettings model instance
            organization_settings: Optional OrganizationSettings model instance
        """
        from app.config import get_settings
        self._settings = get_settings()
        
        self.system_settings = system_settings
        self.org_settings = organization_settings
        
        # 1. Determine Provider
        self.provider = None
        
        # A. Try Org Provider ONLY if it has a key configured
        if self.org_settings and hasattr(self.org_settings, 'ai_provider') and self.org_settings.ai_provider:
            org_p = self.org_settings.ai_provider.value if hasattr(self.org_settings.ai_provider, "value") else str(self.org_settings.ai_provider).lower()
            if self._has_org_key(org_p):
                self.provider = org_p
                print(f"[LLMClient] Using ORGANIZATION provider: {self.provider}")
        
        # B. Try System Provider if no Org provider or Org provider had no key
        if not self.provider and self.system_settings and hasattr(self.system_settings, 'ai_provider') and self.system_settings.ai_provider:
            self.provider = self.system_settings.ai_provider.lower()
            print(f"[LLMClient] Using SYSTEM provider: {self.provider}")
            
        # C. Fallback to global config
        if not self.provider:
            self.provider = self._settings.llm_provider.lower() or os.getenv("LLM_PROVIDER", "openai").lower()
            print(f"[LLMClient] Using FALLBACK provider: {self.provider}")

        # 2. Determine API Key (Org -> System -> Env)
        self._api_key = self._get_effective_api_key()
        if self._api_key:
            self._api_key = self._api_key.strip()
            
        # 3. Determine Model (Org -> System -> Env)
        self._model = self._get_effective_model()
        
        # Priority: If GEMINI_MODEL is in env, respect it specifically for gemini
        env_gemini = os.getenv("GEMINI_MODEL")
        if self.provider == "gemini" and env_gemini:
            self._model = env_gemini
            print(f"[LLMClient] Explicit GEMINI_MODEL override from env: {self._model}")
        
        # 4. Map legacy models to modern versions
        if self.provider == "gemini":
            legacy_names = ["gemini-pro", "gemini-1.5-flash-latest", "gemini-1.5-flash"]
            if self._model in legacy_names or not self._model:
                # If 1.5-flash (failing) is the model or no model set, default to 2.0
                print(f"[LLMClient] Mapping model '{self._model}' to 'gemini-2.0-flash' for compatibility")
                self._model = "gemini-2.0-flash"
            
        print(f"[LLMClient] Initializing - provider: {self.provider}, model: {self._model}, has_key: {bool(self._api_key)}")
        
        # Initialize the underlying client
        self._client = None
        self._init_client()

    def _get_effective_api_key(self) -> Optional[str]:
        """Get API key using hierarchy: Org -> System -> Env for the selected provider."""
        # A. Try Organization Settings
        key = self._get_org_api_key()
        if key: 
            preview = f"{key[:4]}...{key[-4:]}" if len(key) > 8 else "***"
            print(f"[LLMClient] Using API key from ORGANIZATION settings (len: {len(key)}, preview: {preview})")
            return key

        # B. Try System Settings
        key = self._get_system_api_key()
        if key: 
            preview = f"{key[:4]}...{key[-4:]}" if len(key) > 8 else "***"
            print(f"[LLMClient] Using API key from SYSTEM settings (len: {len(key)}, preview: {preview})")
            return key

        # C. Try Env Vars
        key = self._get_env_api_key()
        if key:
            preview = f"{key[:4]}...{key[-4:]}" if len(key) > 8 else "***"
            print(f"[LLMClient] Using API key from ENVIRONMENT variables (len: {len(key)}, preview: {preview})")
            return key
            
        print("[LLMClient] No API key found in any source!")
        return None

    def _get_effective_model(self) -> str:
        """Get model using hierarchy: Org -> System -> Env for the selected provider."""
        # A. Try Organization Settings
        model = self._get_org_model_internal()
        if model: return model

        # B. Try System Settings
        model = self._get_system_model_internal()
        if model: return model

        # C. Try Env Vars
        return self._get_env_model()

    def _has_org_key(self, provider: str) -> bool:
        """Check if organization has a non-empty key for the provider."""
        if not self.org_settings:
            return False
            
        key_attr = {
            "openai": "openai_api_key",
            "gemini": "gemini_api_key",
            "azure_openai": "azure_openai_key",
            "anthropic": "anthropic_api_key",
            "litellm": "litellm_api_key"
        }.get(provider)
        
        if not key_attr:
            return False
            
        val = getattr(self.org_settings, key_attr, None)
        if not val:
            return False
            
        # Also check if it's just a mask
        from app.utils.encryption import is_mask
        return not is_mask(val)
    
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
    
    def _get_org_model_internal(self) -> Optional[str]:
        """Get model name from organization settings without fallback."""
        if not self.org_settings:
            return None
        
        if self.provider == "openai":
            return self.org_settings.openai_model
        elif self.provider == "gemini":
            return self.org_settings.gemini_model
        elif self.provider == "azure_openai":
            return self.org_settings.azure_openai_deployment
        elif self.provider == "litellm":
            return self.org_settings.litellm_model
        return None

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
    
    def _get_system_model_internal(self) -> Optional[str]:
        """Get model name from system settings without fallback."""
        if not self.system_settings:
            return None
        
        if self.provider == "openai":
            return self.system_settings.openai_model
        elif self.provider == "gemini":
            return self.system_settings.gemini_model
        elif self.provider == "azure_openai":
            return self.system_settings.azure_openai_deployment
        elif self.provider == "litellm":
            return self.system_settings.litellm_model
        return None
    
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
            return os.getenv("GEMINI_MODEL") or os.getenv("GOOGLE_MODEL") or "gemini-1.5-flash"
        elif self.provider == "litellm":
            return self._settings.litellm_model or os.getenv("LITELLM_MODEL", "gpt-4o-mini")
        return self._get_default_model()
    
    def _get_default_model(self) -> str:
        """Get default model for provider."""
        if self.provider == "openai":
            return "gpt-4o-mini"
        elif self.provider == "gemini":
            return "gemini-2.0-flash"
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
            from app.utils.encryption import is_mask
            if not self._api_key or is_mask(self._api_key):
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
                from google import genai
                # Map 'v1beta' issues by forcing 'v1' or letting it default if v1 fails
                self._client = genai.Client(api_key=self._api_key, http_options={'api_version': 'v1'})
                print(f"[LLM] Gemini client initialized with new SDK (v1), model: {self._model}")
            except ImportError:
                raise ImportError("google-genai package not installed. Run: pip install google-genai")
        
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
        
        print(f"[LLM] Dispatching request - provider: {self.provider}, model: {self._model}")
        
        try:
            if self.provider == "openai":
                return await self._generate_openai(prompt, max_tokens, temperature)
            elif self.provider == "gemini":
                return await self._generate_gemini(prompt, max_tokens, temperature, media_path)
            elif self.provider == "azure_openai":
                return await self._generate_azure_openai(prompt, max_tokens, temperature)
            elif self.provider == "anthropic":
                return await self._generate_anthropic(prompt, max_tokens, temperature)
            elif self.provider == "litellm":
                return await self._generate_litellm(prompt, max_tokens, temperature, media_path)
            else:
                print(f"[LLM] Unknown provider '{self.provider}', falling back to LiteLLM logic")
                return await self._generate_litellm(prompt, max_tokens, temperature, media_path)
        except Exception as e:
            print(f"[LLM] Error in {self.provider} generation: {str(e)}")
            # If standard provider fails, try LiteLLM as a last-resort bridge if it was configured
            if self.provider != "litellm" and (self._settings.litellm_base_url or os.getenv("LITELLM_BASE_URL")):
                 print(f"[LLM] Attempting emergency fallback via LiteLLM...")
                 # Note: This requires the client to be re-initialized for LiteLLM
                 return f"Error generating response: {str(e)}"
            return f"Error generating response: {str(e)}"
    
    async def chat(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4000
    ) -> str:
        """
        Chat completion with message history.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Creativity parameter (0-1)
            max_tokens: Maximum tokens in response
        
        Returns:
            Generated text response
        """
        # Check if client is available
        if self._client is None:
            # Fallback: use last user message
            last_user_msg = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "")
            return self._get_demo_response(last_user_msg)
        
        if self.provider == "openai":
            return await self._chat_openai(messages, max_tokens, temperature)
        elif self.provider == "gemini":
            return await self._chat_gemini(messages, max_tokens, temperature)
        elif self.provider == "azure_openai":
            return await self._chat_azure_openai(messages, max_tokens, temperature)
        elif self.provider == "anthropic":
            return await self._chat_anthropic(messages, max_tokens, temperature)
        elif self.provider == "litellm":
            return await self._chat_litellm(messages, max_tokens, temperature)
        else:
            # Fallback
            last_user_msg = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "")
            return self._get_demo_response(last_user_msg)
    
    async def _chat_openai(self, messages: list[dict], max_tokens: int, temperature: float) -> str:
        """Chat using OpenAI."""
        try:
            response = await asyncio.wait_for(
                self._client.chat.completions.create(
                    model=self._model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                ),
                timeout=30.0
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _chat_azure_openai(self, messages: list[dict], max_tokens: int, temperature: float) -> str:
        """Chat using Azure OpenAI."""
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _chat_gemini(self, messages: list[dict], max_tokens: int, temperature: float) -> str:
        """Chat using Google Gemini (google-genai SDK)."""
        try:
            from google.genai import types
            
            # Convert messages to Gemini format (role: user/model)
            history = []
            for msg in messages[:-1]:
                role = "user" if msg['role'] == 'user' else "model"
                history.append(types.Content(role=role, parts=[types.Part(text=msg['content'])]))
            
            last_msg = messages[-1]['content'] if messages else ""
            
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=history + [types.Content(role="user", parts=[types.Part(text=last_msg)])],
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
            )
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _chat_anthropic(self, messages: list[dict], max_tokens: int, temperature: float) -> str:
        """Chat using Anthropic."""
        try:
            # Anthropic separates system message
            system_msg = next((m['content'] for m in messages if m['role'] == 'system'), "")
            user_msgs = [m for m in messages if m['role'] != 'system']
            
            response = await self._client.messages.create(
                model=self._model,
                system=system_msg,
                messages=user_msgs,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.content[0].text
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _chat_litellm(self, messages: list[dict], max_tokens: int, temperature: float) -> str:
        """Chat using LiteLLM."""
        try:
            import litellm
            
            # Determine base URL - check all sources
            api_base = None
            if self.org_settings and hasattr(self.org_settings, 'litellm_base_url') and self.org_settings.litellm_base_url:
                api_base = self.org_settings.litellm_base_url
            elif self.system_settings and hasattr(self.system_settings, 'litellm_base_url') and self.system_settings.litellm_base_url:
                api_base = self.system_settings.litellm_base_url
            elif self._settings.litellm_base_url:
                api_base = self._settings.litellm_base_url
            else:
                api_base = os.getenv("LITELLM_BASE_URL", "")
            
            # Clean up base URL
            if api_base:
                api_base = api_base.strip().rstrip('/')
            
            # Model name - for LiteLLM with custom proxy, use openai/ prefix
            model_to_use = self._model
            if api_base and not model_to_use.startswith('openai/'):
                model_to_use = f"openai/{model_to_use}"
            
            print(f"[LLM] Chat with LiteLLM - model: {model_to_use}, base: {api_base}")
            
            # Build completion kwargs
            completion_kwargs = {
                "model": model_to_use,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }
            
            # Add API key and base URL if available
            if self._api_key:
                completion_kwargs["api_key"] = self._api_key
            if api_base:
                completion_kwargs["api_base"] = api_base
            
            response = await litellm.acompletion(**completion_kwargs)
            result = response.choices[0].message.content
            print(f"[LLM] LiteLLM chat success, response length: {len(result)}")
            return result
        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            print(f"[LLM] LiteLLM chat exception: {error_msg}")
            import traceback
            print(f"[LLM] Traceback: {traceback.format_exc()}")
            return error_msg
    
    async def _generate_openai(self, prompt: str, max_tokens: int, temperature: float, media_path: Optional[str] = None) -> str:
        """Generate using OpenAI."""
        try:
            messages = [
                {"role": "system", "content": "You are an expert teaching assistant for government school teachers. Provide practical, actionable advice that can be implemented immediately in the classroom."},
            ]
            
            user_content = [{"type": "text", "text": prompt}]
            
            if media_path:
                print(f"[LLM] OpenAI request has media: {media_path}")
                # For OpenAI, we handle images via base64. PDFs are typically not supported directly in Chat Completions
                # unless using the Assistant API or if the model handles PDF text extraction.
                # For this implementation, we focus on making the structure agnostic.
                if media_path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                     import base64
                     # Logic to read/encode file (simplified for plan)
                     # user_content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}})
                     pass

            messages.append({"role": "user", "content": user_content})

            response = await asyncio.wait_for(
                self._client.chat.completions.create(
                    model=self._model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                ),
                timeout=30.0
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
        """Generate using Google Gemini (google-genai SDK)."""
        try:
            from google.genai import types
            import httpx
            import tempfile
            import os
            
            contents = [prompt]
            
            if media_path:
                print(f"[LLM] Gemini request has media: {media_path}")
                if media_path.startswith("http"):
                    # Use the SDK's ability to handle media if possible, or download
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(media_path)
                        if resp.status_code == 200:
                            mime_type = "application/pdf" if media_path.lower().endswith(".pdf") else "image/jpeg"
                            contents.append(types.Part.from_bytes(data=resp.content, mime_type=mime_type))
                elif os.path.exists(media_path):
                    mime_type = "application/pdf" if media_path.lower().endswith(".pdf") else "image/jpeg"
                    with open(media_path, "rb") as f:
                        contents.append(types.Part.from_bytes(data=f.read(), mime_type=mime_type))
            
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=contents,
                config=types.GenerateContentConfig(
                    max_output_tokens=max_tokens,
                    temperature=temperature,
                )
            )
            
            # Log full response details for debugging
            print(f"[LLM] Gemini response received. Finish reason: {response.candidates[0].finish_reason if response.candidates else 'None'}")
            
            if response.candidates and response.candidates[0].finish_reason == types.FinishReason.SAFETY:
                return "I apologize, but I cannot answer that as it was flagged by my safety filters. Let's try rephrasing or focusing specifically on the lesson content."
            
            if not response.text:
                print(f"[LLM] Warning: Gemini returned empty text. Full response: {response}")
                return "The AI assistant was unable to generate a response. Please try again."

            return response.text
        except Exception as e:
            error_str = str(e)
            print(f"[LLM] Gemini request failed: {error_str}")
            import traceback
            traceback.print_exc()
            
            # Comprehensive fallback for Gemini 404s
            if "not found" in error_str.lower() or "not supported" in error_str.lower():
                # Diagnostic: Try to list available models to logs
                try:
                    print("[LLM] Diagnostic: Attempting to list available models for this key...")
                    available = []
                    async for m in await self._client.aio.models.list():
                        available.append(m.name)
                    print(f"[LLM] Available models: {available}")
                except Exception as list_err:
                    print(f"[LLM] Model listing failed: {str(list_err)}")

                fallbacks = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
                # Filter out the model that just failed
                fallbacks = [m for m in fallbacks if m != self._model]
                
                print(f"[LLM] Attempting fallbacks: {fallbacks}")
                
                for model_name in fallbacks:
                    try:
                        print(f"[LLM] Trying fallback to '{model_name}'...")
                        response = await self._client.aio.models.generate_content(
                            model=model_name,
                            contents=contents,
                            config=types.GenerateContentConfig(
                                max_output_tokens=max_tokens,
                                temperature=temperature,
                            )
                        )
                        return response.text
                    except Exception as e_inner:
                        print(f"[LLM] Fallback to '{model_name}' failed: {str(e_inner)}")
                        continue
            
            return f"Error generating response: {error_str}"
    
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
    
    async def _generate_litellm(self, prompt: str, max_tokens: int, temperature: float, media_path: Optional[str] = None) -> str:
        """Generate using LiteLLM (provider-agnostic)."""
        try:
            # Determine base URL - check all sources including os.getenv
            api_base = None
            if self.org_settings and hasattr(self.org_settings, 'litellm_base_url') and self.org_settings.litellm_base_url:
                api_base = self.org_settings.litellm_base_url
            elif self.system_settings and hasattr(self.system_settings, 'litellm_base_url') and self.system_settings.litellm_base_url:
                api_base = self.system_settings.litellm_base_url
            elif self._settings.litellm_base_url:
                api_base = self._settings.litellm_base_url
            else:
                api_base = os.getenv("LITELLM_BASE_URL", "")
            
            # Clean up base URL
            if api_base:
                api_base = api_base.strip().rstrip('/')
                
            # Model name to use - for LiteLLM with custom proxy, use openai/ prefix
            model_to_use = self._model
            if api_base and not model_to_use.startswith('openai/') and not model_to_use.startswith('gemini/'):
                # Force OpenAI-compatible API for custom proxy (most common)
                model_to_use = f"openai/{model_to_use}"
            
            # Build messages
            user_content = [{"type": "text", "text": prompt}]
            
            if media_path:
                print(f"[LLM] LiteLLM request has media: {media_path}")
                # For LiteLLM, we can pass URL if it's a URL, or we need to encode if local
                # However, many LiteLLM models support URLs directly
                if media_path.startswith("http"):
                    # Detect type
                    mime_type = "image/jpeg"
                    if media_path.lower().endswith(".pdf"):
                         mime_type = "application/pdf"
                    
                    if mime_type == "application/pdf":
                        # PDFs are passed as image_url for vision models (Gemini, GPT-4o)
                        # Most vision-capable models can process PDF URLs this way
                        user_content.append({
                            "type": "image_url",
                            "image_url": {"url": media_path}
                        })
                        print(f"[LLM] Added PDF as image_url for vision processing")
                    else:
                        user_content.append({
                            "type": "image_url",
                            "image_url": {"url": media_path}
                        })
                else:
                    # Local file path - need to handle for remote proxy
                    # Try to read and base64 encode the file
                    import base64
                    import os
                    if os.path.exists(media_path):
                        try:
                            with open(media_path, "rb") as f:
                                file_content = base64.b64encode(f.read()).decode("utf-8")
                            mime_type = "application/pdf" if media_path.lower().endswith(".pdf") else "image/jpeg"
                            data_url = f"data:{mime_type};base64,{file_content}"
                            user_content.append({
                                "type": "image_url",
                                "image_url": {"url": data_url}
                            })
                            print(f"[LLM] Encoded local file as base64 data URL")
                        except Exception as e:
                            print(f"[LLM] Failed to encode local file: {e}")
                    else:
                        print(f"[LLM] Local file not found: {media_path}")

            # Log the actual request parameters
            print(f"[LLM] Generating with LiteLLM - model: {model_to_use}, base: {api_base}, key_len: {len(self._api_key) if self._api_key else 0}")
            
            # Build kwargs for the completion call
            completion_kwargs = {
                "model": model_to_use,
                "messages": [
                    {"role": "system", "content": "You are an expert teaching assistant for government school teachers. Provide practical, actionable advice."},
                    {"role": "user", "content": user_content}
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }
            
            # Add API key and base URL if available
            if self._api_key:
                completion_kwargs["api_key"] = self._api_key
            if api_base:
                completion_kwargs["api_base"] = api_base
            
            response = await asyncio.wait_for(
                self._client.acompletion(**completion_kwargs),
                timeout=60.0  # Increased timeout to 60 seconds
            )
            
            # Handle potential null content from the response
            if response and response.choices and len(response.choices) > 0:
                result = response.choices[0].message.content
                if result is None:
                    print(f"[LLM] Warning: LiteLLM returned null content. Model: {model_to_use}")
                    return "Error generating response: The AI model returned an empty response. Please try again or contact support."
                print(f"[LLM] LiteLLM response received, length: {len(result) if result else 0}")
                return result
            else:
                print(f"[LLM] Warning: LiteLLM returned invalid response structure")
                return "Error generating response: Invalid response from AI service."
            return result
        except asyncio.TimeoutError:
            error_msg = "Request timed out after 60 seconds. Please try again."
            print(f"[LLM] LiteLLM timeout error: {error_msg}")
            return f"Error generating response: {error_msg}"
        except Exception as e:
            error_str = str(e) if str(e) else "Unknown error occurred"
            print(f"[LLM] Error in LiteLLM generation: {error_str}")
            import traceback
            traceback.print_exc()
            return f"Error generating response: {error_str}"
    
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
