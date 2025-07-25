import discord
from utils.llm import LLM, Message
from config import Config
from bot import bot, logger

translate_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "translate_message",
        "schema": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "The content of the message to be translated.",
                },
                "target_language": {
                    "type": "string",
                    "description": "The language code to translate the message into.",
                },
            },
            "required": ["content", "target_language"],
            "additionalProperties": False,
        },
        "strict": True,
    },
}


@bot.event
async def on_message(message: discord.Message):
    if message.author.bot:
        return

    if bot.guild_id and message.guild and message.guild.id != bot.guild_id:
        return

    await bot.process_commands(message)

    if (
        Config.TRANSLATION.CHANNEL_IDS
        and str(message.channel.id) not in Config.TRANSLATION.CHANNEL_IDS
    ):
        return

    llm = LLM(
        api_key=Config.TRANSLATION.LLM_API_KEY, base_url=Config.TRANSLATION.LLM_BASE_URL
    )

    target_language = "en"

    try:
        response = llm.structured_output(
            system_prompt=f"You are a translation bot. Translate the message content to {target_language}.",
            input=Message(role="user", content=message.content),
            model=Config.TRANSLATION.LLM_MODEL,
            response_format=translate_schema,
        )
        #webhook
    except Exception as e:
        logger.error(f"LLM error: {str(e)}")
        await message.channel.send("An error occurred while processing your request.")
        return
