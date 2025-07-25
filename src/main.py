import asyncio
import traceback
from config import Config
from bot import bot, logger


async def main():
    try:
        async with bot:
            await bot.start(Config.BOT_TOKEN)
    except KeyboardInterrupt:
        logger.info("Bot stopped by user (KeyboardInterrupt).")
    except Exception as e:
        logger.critical(f"Bot crashed: {str(e)}")
        logger.critical(traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(main())
