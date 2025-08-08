import os


class Config:
    BOT_TOKEN = os.getenv("BOT_TOKEN")
    BOT_PREFIX = os.getenv("BOT_PREFIX", "!")
    GUILD_ID = os.getenv("GUILD_ID")

    class LOG:
        LOG_FILE_PATH = "logs/bot.log"
        LOG_TO_FILE = True
        LOG_LEVEL = "INFO"

    class TRANSLATION:
        # Channel IDs where translation reactions should be added
        # Leave empty list to enable in all channels
        CHANNEL_IDS = os.getenv("TRANSLATION_CHANNEL_IDS", "").split(",") if os.getenv("TRANSLATION_CHANNEL_IDS") else []
        
        # LLM Configuration
        LLM_API_KEY = os.getenv("LLM_API_KEY")
        LLM_MODEL = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
        LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        
        # Translation settings
        MIN_MESSAGE_LENGTH = int(os.getenv("MIN_MESSAGE_LENGTH", "3"))
        MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", "2000"))
        
        # Rate limiting (future feature)
        RATE_LIMIT_PER_USER = int(os.getenv("TRANSLATION_RATE_LIMIT", "10"))  # translations per hour
        RATE_LIMIT_WINDOW = int(os.getenv("TRANSLATION_RATE_WINDOW", "3600"))  # seconds