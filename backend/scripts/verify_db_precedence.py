
import os
import sys

# Add backend to path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.utils.encryption import encrypt_value
from app.ai.llm_client import LLMClient

class MockSystemSettings:
    def __init__(self, provider, key, model):
        self.ai_provider = provider
        self.google_api_key = encrypt_value(key)
        self.gemini_model = model
        # Add other fields as expected by LLMClient
        self.openai_api_key = None
        self.openai_model = "gpt-4o-mini"
        self.anthropic_api_key = None
        self.azure_openai_endpoint = None
        self.azure_openai_key = None
        self.azure_openai_deployment = None
        self.litellm_api_key = None
        self.litellm_base_url = None
        self.litellm_model = "gpt-4o-mini"

def test_db_settings_precedence():
    print("Testing DB settings precedence over Environment variables...")
    
    # 1. Set environment variable to a placeholder
    os.environ["LLM_PROVIDER"] = "gemini"
    os.environ["GOOGLE_API_KEY"] = "your...-key"
    
    # 2. Create mock DB settings with a valid-looking key
    valid_key = "AIzaSyD-valid-db-key-123"
    db_settings = MockSystemSettings("gemini", valid_key, "gemini-1.5-flash")
    
    # 3. Initialize client WITH db settings
    print("\nCase A: LLMClient WITH DB settings")
    client_with_db = LLMClient(system_settings=db_settings)
    
    print(f"  Provider: {client_with_db.provider}")
    print(f"  API Key used: {client_with_db._api_key}")
    
    assert client_with_db._api_key == valid_key
    assert client_with_db._client is not None
    print("✅ SUCCESS: LLMClient used the valid key from DB settings.")

    # 4. Initialize client WITHOUT db settings (old behavior)
    print("\nCase B: LLMClient WITHOUT DB settings (fallback to Env)")
    client_no_db = LLMClient()
    
    print(f"  Provider: {client_no_db.provider}")
    print(f"  API Key used: {client_no_db._api_key}")
    
    assert client_no_db._api_key == "your...-key"
    assert client_no_db._client is None # Should be demo mode
    print("✅ SUCCESS: LLMClient correctly used Env fallback when no DB settings were passed.")

if __name__ == "__main__":
    try:
        # Mock JWT_SECRET for encryption
        os.environ["JWT_SECRET"] = "test_secret_key"
        test_db_settings_precedence()
        print("\nAll DB precedence verifications passed successfully!")
    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
