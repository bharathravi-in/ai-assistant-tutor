
import os
import sys

# Mocking app context
sys.path.append('.')
os.environ['JWT_SECRET_KEY'] = 'test-secret'

from app.utils.encryption import encrypt_value, decrypt_value

test_key = "AIzaTestKey123"
encrypted = encrypt_value(test_key)
decrypted = decrypt_value(encrypted)

print(f"Original:  {test_key}")
print(f"Encrypted: {encrypted}")
print(f"Decrypted: {decrypted}")

if test_key == decrypted:
    print("SUCCESS: Encryption/Decryption works.")
else:
    print("FAILURE: Decryption did not match original.")
