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
            return "gemini-1.5-flash"
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
                return await self._generate_litellm(prompt, max_tokens, temperature)
            else:
                print(f"[LLM] Unknown provider '{self.provider}', falling back to LiteLLM logic")
                return await self._generate_litellm(prompt, max_tokens, temperature)
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
        """Chat using Google Gemini."""
        try:
            # Gemini uses a different message format
            chat = self._client.start_chat(history=[])
            
            # Convert messages to Gemini format
            for msg in messages[:-1]:  # All except last
                if msg['role'] == 'user':
                    chat.send_message(msg['content'])
            
            # Send final user message
            last_msg = messages[-1]['content'] if messages else ""
            response = await asyncio.wait_for(
                chat.send_message_async(
                    last_msg,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_tokens,
                    }
                ),
                timeout=30.0
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
        """Generate using Google Gemini."""
        try:
            import google.generativeai as genai
            import httpx
            import tempfile
            
            content_parts = [prompt]
            
            if media_path:
                print(f"[LLM] Gemini request has media: {media_path}")
                # Handle URLs vs Local Paths
                if media_path.startswith("http"):
                    print(f"[LLM] Downloading media from URL: {media_path}")
                    try:
                        async with httpx.AsyncClient() as client:
                            response = await client.get(media_path)
                            if response.status_code == 200:
                                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                                    tmp.write(response.content)
                                    actual_path = tmp.name
                                print(f"[LLM] Media downloaded to: {actual_path}")
                                uploaded_file = genai.upload_file(path=actual_path)
                                content_parts.append(uploaded_file)
                                # Note: Ideally delete the temp file after use, but for now we leave it
                                # as genai.upload_file might need it during the call?
                                # Actually, upload_file is synchronous and returns.
                                os.unlink(actual_path)
                            else:
                                print(f"[LLM] Failed to download media: {response.status_code}")
                    except Exception as e:
                        print(f"[LLM] Error downloading media: {e}")
                else:
                    # Existing local path logic
                    filename = media_path.split("/")[-1]
                    possible_paths = [
                        os.path.join("uploads", filename),
                        os.path.join("uploads", "voice", filename),
                        os.path.join("uploads", "voices", filename),
                        os.path.join("/app/uploads", filename),
                        os.path.join("/app/uploads/voice", filename),
                        media_path.lstrip("/"),
                        media_path
                    ]
                    
                    actual_path = None
                    for path in possible_paths:
                        if os.path.exists(path) and os.path.isfile(path):
                            actual_path = path
                            break
                    
                    if actual_path:
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
            if hasattr(response, 'candidates') and response.candidates:
                # Check if the first candidate has parts
                if response.candidates[0].content.parts:
                    return response.text
                else:
                    print(f"[LLM] Gemini response blocked or empty. Safety: {response.candidates[0].safety_ratings}")
                    return "Error: The AI response was blocked by safety filters or is empty."
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
            if api_base and not model_to_use.startswith('openai/'):
                # Force OpenAI-compatible API for custom proxy
                model_to_use = f"openai/{model_to_use}"
            
            # Log the actual request parameters
            print(f"[LLM] Generating with LiteLLM - model: {model_to_use}, base: {api_base}, key_len: {len(self._api_key) if self._api_key else 0}")
            
            # Build kwargs for the completion call
            completion_kwargs = {
                "model": model_to_use,
                "messages": [
                    {"role": "system", "content": "You are an expert teaching assistant for government school teachers. Provide practical, actionable advice."},
                    {"role": "user", "content": prompt}
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
