
import asyncio
import os
from google.genai import Client
import sys

async def list_gemini_models():
    # Try to find the key
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in environment.")
        return

    print(f"Using API Key: {api_key[:4]}...{api_key[-4:]}")
    
    try:
        client = Client(api_key=api_key, http_options={'api_version': 'v1beta'})
        print("\nListing models available for this key (v1beta):")
        # For the new SDK, we might need to iterate or use specific methods
        # Let's try to use the models service
        async for model in await client.aio.models.list():
            print(f"- {model.name} (Supported: {model.supported_generation_methods})")
            
        print("\nListing models available for this key (v1):")
        client_v1 = Client(api_key=api_key, http_options={'api_version': 'v1'})
        async for model in await client_v1.aio.models.list():
            print(f"- {model.name} (Supported: {model.supported_generation_methods})")

    except Exception as e:
        print(f"Error listing models: {str(e)}")

if __name__ == "__main__":
    asyncio.run(list_gemini_models())
