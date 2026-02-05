
import os
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv

async def test_gemini():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    
    print(f"Testing with model: {model_name}")
    print(f"API Key present: {bool(api_key)}")
    
    if not api_key:
        print("Error: No API key found")
        return

    client = genai.Client(api_key=api_key, http_options={'api_version': 'v1alpha'})
    
    try:
        response = await client.aio.models.generate_content(
            model=model_name,
            contents=["Hello, are you working?"],
            config=types.GenerateContentConfig(
                max_output_tokens=100,
                temperature=0.7,
            )
        )
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
