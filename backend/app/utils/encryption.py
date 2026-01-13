"""
Encryption Utilities for Secure Configuration Storage
"""
import os
import base64
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def get_encryption_key() -> bytes:
    """
    Get or generate the encryption key.
    Uses ENCRYPTION_KEY from environment or derives from JWT_SECRET_KEY.
    """
    # Try to get explicit encryption key first
    key = os.getenv("ENCRYPTION_KEY")
    if key:
        # Ensure key is valid Fernet key (32 bytes base64 encoded)
        try:
            return base64.urlsafe_b64decode(key)
        except Exception:
            pass
    
    # Derive key from JWT secret
    jwt_secret = os.getenv("JWT_SECRET_KEY", "default-secret-change-me")
    salt = os.getenv("ENCRYPTION_SALT", "ai-teaching-platform-salt").encode()
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480000,
    )
    
    key = base64.urlsafe_b64encode(kdf.derive(jwt_secret.encode()))
    return key


def get_fernet() -> Fernet:
    """Get Fernet instance for encryption/decryption."""
    return Fernet(get_encryption_key())


def encrypt_value(value: str) -> str:
    """
    Encrypt a sensitive value.
    
    Args:
        value: Plain text value to encrypt
        
    Returns:
        Base64 encoded encrypted value
    """
    if not value:
        return ""
    
    fernet = get_fernet()
    encrypted = fernet.encrypt(value.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_value(encrypted: str) -> str:
    """
    Decrypt an encrypted value.
    
    Args:
        encrypted: Base64 encoded encrypted value
        
    Returns:
        Decrypted plain text value
    """
    if not encrypted:
        return ""
    
    try:
        fernet = get_fernet()
        encrypted_bytes = base64.urlsafe_b64decode(encrypted.encode())
        decrypted = fernet.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception:
        # Return empty string if decryption fails
        return ""


def mask_value(value: str, visible_chars: int = 4) -> str:
    """
    Mask a sensitive value for display.
    
    Args:
        value: Value to mask
        visible_chars: Number of characters to show at start and end
        
    Returns:
        Masked value like "••••••••" or "sk-x••••xxxx"
    """
    if not value:
        return ""
    
    return "••••••••"


def is_encrypted(value: str) -> bool:
    """
    Check if a value appears to be encrypted.
    
    Args:
        value: Value to check
        
    Returns:
        True if value appears to be encrypted
    """
    if not value:
        return False
    
    try:
        # Try to decode as base64
        decoded = base64.urlsafe_b64decode(value.encode())
        # Fernet tokens have a specific structure
        return len(decoded) > 80  # Fernet tokens are typically > 80 bytes
    except Exception:
        return False
