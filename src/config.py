import os

class Config:
    BOT_TOKEN = os.getenv("BOT_TOKEN")
    BOT_PREFIX = os.getenv("BOT_PREFIX", "!")
    GUILD_ID = os.getenv("GUILD_ID")
    class LOG:
        LOG_FILE_PATH = "logs/bot.log"
        LOG_TO_FILE = True
        LOG_LEVEL = "INFO"