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
        CHANNEL_IDS = ["123456789012345678", "234567890123456789"]
        LLM_API_KEY = os.getenv("LLM_API_KEY")
        LLM_MODEL =  "gpt-3.5-turbo"
        LLM_BASE_URL = "https://api.openai.com/v1"