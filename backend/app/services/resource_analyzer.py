"""
Resource Analyzer Service
Extracts and analyzes content from uploaded resources (PDFs, documents)
"""
import os
import io
import httpx
from typing import Optional
from ..config import get_settings
from ..services.storage import get_storage_provider

settings = get_settings()

# Cache for extracted content
_content_cache: dict[int, str] = {}


async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text content from PDF bytes using pypdf."""
    try:
        from pypdf import PdfReader
        
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text.strip())
        
        return "\n\n".join(text_parts)
    except ImportError:
        # pypdf not installed, return placeholder
        return "[PDF text extraction requires pypdf library]"
    except Exception as e:
        return f"[Error extracting PDF: {str(e)}]"


async def fetch_resource_content(content_url: str) -> Optional[bytes]:
    """Fetch resource content from URL (local or GCS signed URL)."""
    if not content_url:
        return None
    
    try:
        # If it's a local path, read from storage
        if content_url.startswith('/uploads/'):
            file_path = content_url.replace('/uploads/', '')
            full_path = f"/app/uploads/{file_path}"
            if os.path.exists(full_path):
                with open(full_path, 'rb') as f:
                    return f.read()
            return None
        
        # For external URLs (GCS), fetch via HTTP
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(content_url)
            if response.status_code == 200:
                return response.content
            return None
    except Exception as e:
        print(f"Error fetching resource content: {e}")
        return None


async def get_resource_text(resource_id: int, content_url: str) -> str:
    """Get extracted text content for a resource, with caching."""
    # Check cache first
    if resource_id in _content_cache:
        return _content_cache[resource_id]
    
    # Get signed URL if needed
    storage = get_storage_provider()
    
    if 'storage.googleapis.com' in content_url:
        # Extract path and get signed URL
        import re
        match = re.search(r'storage\.googleapis\.com/[^/]+/(.+)$', content_url)
        if match:
            gcs_path = match.group(1)
            content_url = storage.get_signed_url(gcs_path, 60)
    
    # Fetch content
    content_bytes = await fetch_resource_content(content_url)
    if not content_bytes:
        return "[Unable to fetch resource content]"
    
    # Extract text based on file type
    if content_url.lower().endswith('.pdf') or b'%PDF' in content_bytes[:10]:
        text = await extract_text_from_pdf(content_bytes)
    else:
        # Try to decode as text
        try:
            text = content_bytes.decode('utf-8')
        except:
            text = "[Binary content - text extraction not supported]"
    
    # Cache the result
    if text and len(text) > 50:
        _content_cache[resource_id] = text
    
    return text


async def analyze_resource(
    resource_id: int,
    title: str,
    content_url: str,
    category: str,
    grade: Optional[str] = None,
    subject: Optional[str] = None
) -> dict:
    """Analyze a resource and generate a summary."""
    # Extract text content
    text_content = await get_resource_text(resource_id, content_url)
    
    # Truncate if too long (for LLM context)
    max_chars = 4000
    if len(text_content) > max_chars:
        text_content = text_content[:max_chars] + "..."
    
    # Check if we have meaningful content
    if len(text_content) < 100 or text_content.startswith("["):
        # Return fallback if extraction failed
        return {
            "success": False,
            "summary": _generate_fallback_summary(title, category, grade, subject),
            "extracted_length": len(text_content),
            "error": "Could not extract meaningful content from document"
        }
    
    # Generate summary using LLM
    from app.ai.llm_client import LLMClient
    
    prompt = f"""Analyze this teaching resource and provide a structured summary for teachers.

Title: {title}
Category: {category}
Grade: {grade or 'All grades'}
Subject: {subject or 'General'}

Document Content:
{text_content}

Provide a summary with these sections:
1. **Main Topic**: One sentence describing the core subject
2. **Key Learning Points**: 3-4 bullet points of the main concepts
3. **Classroom Application**: 2-3 practical tips for using this in class

Keep the response concise and teacher-focused. Use markdown formatting."""

    try:
        llm = LLMClient()
        response = await llm.generate(prompt)
        return {
            "success": True,
            "summary": response,
            "extracted_length": len(text_content)
        }
    except Exception as e:
        # Fallback summary
        return {
            "success": False,
            "summary": _generate_fallback_summary(title, category, grade, subject),
            "extracted_length": len(text_content),
            "error": str(e)
        }


def _generate_fallback_summary(title: str, category: str, grade: Optional[str], subject: Optional[str]) -> str:
    """Generate a fallback summary when AI is unavailable."""
    return f"""**{title}**

**Main Topic**: This resource covers {category} concepts for classroom implementation.

**Key Learning Points**:
• Provides practical guidance for {category} teaching strategies
• Suitable for {grade or 'all grades'} {subject or 'general'} learning
• Focus on developing effective teaching practices
• Includes actionable methods for classroom use

**Classroom Application**:
• Review key concepts before your lesson
• Adapt examples to your specific student context
• Use as reference material during lesson planning"""


async def ask_about_resource(
    resource_id: int,
    title: str,
    content_url: str,
    question: str,
    category: str,
    grade: Optional[str] = None,
    subject: Optional[str] = None
) -> dict:
    """Answer a question about a specific resource."""
    # Extract text content
    text_content = await get_resource_text(resource_id, content_url)
    
    # Truncate if too long
    max_chars = 3000
    if len(text_content) > max_chars:
        text_content = text_content[:max_chars] + "..."
    
    # Check if we have meaningful content
    has_content = len(text_content) > 100 and not text_content.startswith("[")
    
    # Generate answer using LLM
    from app.ai.llm_client import LLMClient
    
    if has_content:
        prompt = f"""You are a helpful teaching assistant. Answer the teacher's question based on this resource.

Resource: {title} ({category})
Grade Level: {grade or 'All grades'}
Subject: {subject or 'General'}

Document Content:
{text_content}

Teacher's Question: {question}

Provide a helpful, concise answer focused on practical classroom application. Base your answer on the document content."""
    else:
        prompt = f"""You are a helpful teaching assistant. Answer the teacher's question about this resource.

Resource: {title} ({category})
Grade Level: {grade or 'All grades'}
Subject: {subject or 'General'}

Teacher's Question: {question}

Provide a helpful, concise answer focused on practical classroom application for {category} topics."""

    try:
        llm = LLMClient()
        response = await llm.generate(prompt)
        return {
            "success": True,
            "answer": response,
            "has_document_context": has_content
        }
    except Exception as e:
        return {
            "success": False,
            "answer": f"I can help you with questions about '{title}'. This {category} resource is designed for {grade or 'various grades'}. Could you try asking a more specific question?",
            "error": str(e)
        }



def clear_cache(resource_id: Optional[int] = None):
    """Clear the content cache."""
    global _content_cache
    if resource_id:
        _content_cache.pop(resource_id, None)
    else:
        _content_cache.clear()
