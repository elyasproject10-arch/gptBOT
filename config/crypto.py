from cryptography.fernet import Fernet
from config.settings import config

class CryptoManager:
    def __init__(self):
        self.fernet = Fernet(config.SESSION_ENCRYPTION_KEY)

    def encrypt(self, plain_text: str) -> str:
        if not plain_text:
            return ""
        return self.fernet.encrypt(plain_text.encode("utf-8")).decode("utf-8")

    def decrypt(self, cipher_text: str) -> str:
        if not cipher_text:
            return ""
        try:
            return self.fernet.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
        except Exception as e:
            print(f"Decryption error: {e}")
            return ""

crypto_manager = CryptoManager()
