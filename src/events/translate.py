import discord
from utils.llm import LLM, Message
from config import Config
from bot import bot, logger

# Import the user language functions from commands
from commands.translation import get_user_language, SUPPORTED_LANGUAGES

TRANSLATE_EMOJI = "🌐"

translate_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "translate_message",
        "schema": {
            "type": "object",
            "properties": {
                "translated_content": {
                    "type": "string",
                    "description": "The translated content of the message.",
                },
                "detected_language": {
                    "type": "string",
                    "description": "The detected source language of the original message (language name, not code).",
                },
                "confidence": {
                    "type": "string",
                    "description": "Confidence level of the translation (high/medium/low).",
                },
            },
            "required": ["translated_content", "detected_language", "confidence"],
            "additionalProperties": False,
        },
        "strict": True,
    },
}


@bot.event
async def on_message(message: discord.Message):
    """Handle new messages - add translation emoji reaction."""
    if message.author.bot:
        return

    # Process commands first
    await bot.process_commands(message)

    # Skip if not in target guild
    if bot.guild_id and message.guild and message.guild.id != bot.guild_id:
        return

    # Skip if not in translation channels (if specified)
    if (
        Config.TRANSLATION.CHANNEL_IDS
        and str(message.channel.id) not in Config.TRANSLATION.CHANNEL_IDS
    ):
        return

    # Skip very short messages or commands
    if len(message.content.strip()) < 3 or message.content.startswith(
        Config.BOT_PREFIX
    ):
        return

    try:
        # Add translation emoji reaction
        await message.add_reaction(TRANSLATE_EMOJI)
        logger.debug(f"Added translation reaction to message {message.id}")
    except discord.errors.Forbidden:
        logger.warning(
            f"Cannot add reaction in channel {message.channel.id} - missing permissions"
        )
    except Exception as e:
        logger.error(f"Error adding reaction: {str(e)}")


@bot.event
async def on_reaction_add(reaction: discord.Reaction, user: discord.User):
    """Handle reaction additions - translate message when users click the translation emoji."""
    # Skip if bot reacted or if it's not the translation emoji
    if user.bot or str(reaction.emoji) != TRANSLATE_EMOJI:
        return

    # Skip if not in target guild
    if (
        bot.guild_id
        and reaction.message.guild
        and reaction.message.guild.id != bot.guild_id
    ):
        return

    # Skip if not in translation channels (if specified)
    if (
        Config.TRANSLATION.CHANNEL_IDS
        and str(reaction.message.channel.id) not in Config.TRANSLATION.CHANNEL_IDS
    ):
        return

    message = reaction.message

    # Skip if the message author is the same as the user reacting
    if message.author.id == user.id:
        try:
            await reaction.remove(user)
        except:
            pass
        return

    try:
        # Remove the user's reaction
        await reaction.remove(user)

        # Get user's preferred language
        target_language = get_user_language(user.id)
        target_language_name = SUPPORTED_LANGUAGES.get(target_language, "English")

        # Skip if message is empty or too short
        if not message.content or len(message.content.strip()) < 3:
            await send_error_dm(user, "Message is too short to translate.")
            return

        # Initialize LLM
        if not Config.TRANSLATION.LLM_API_KEY:
            await send_error_dm(user, "Translation service is not configured.")
            return

        llm = LLM(
            api_key=Config.TRANSLATION.LLM_API_KEY,
            base_url=Config.TRANSLATION.LLM_BASE_URL,
        )

        # Create translation prompt
        system_prompt = f"""You are a professional translator. Translate the given message to {target_language_name} ({target_language}).

Rules:
- Provide accurate, natural translations
- Maintain the original tone and style
- If the message is already in the target language, still provide the "translation" (which may be the same)
- Detect the source language of the original message
- Assess your confidence in the translation quality

Respond with the translated content, detected source language, and confidence level."""

        # Get translation
        response = llm.structured_output(
            system_prompt=system_prompt,
            input=Message(role="user", content=message.content),
            model=Config.TRANSLATION.LLM_MODEL,
            response_format=translate_schema,
        )

        # Create and send embed to user's DM
        await send_translation_dm(
            user=user,
            original_message=message,
            translation_data=response,
            target_language=target_language_name,
        )

        logger.info(f"Translated message {message.id} for user {user.id}")

    except discord.errors.Forbidden:
        logger.warning(f"Cannot send DM to user {user.id} - DMs may be disabled")
    except Exception as e:
        logger.error(f"Translation error for user {user.id}: {str(e)}")
        await send_error_dm(
            user, "An error occurred while translating. Please try again later."
        )


async def send_translation_dm(
    user: discord.User,
    original_message: discord.Message,
    translation_data: dict,
    target_language: str,
):
    """Send a translation embed to the user's DM."""

    embed = discord.Embed(
        title="🌐 Message Translation",
        color=discord.Color.blue(),
        timestamp=original_message.created_at,
    )

    # Original message field
    original_text = original_message.content
    if len(original_text) > 1024:
        original_text = original_text[:1021] + "..."

    embed.add_field(
        name=f"Original ({translation_data.get('detected_language', 'Unknown')})",
        value=f"```{original_text}```",
        inline=False,
    )

    # Translated message field
    translated_text = translation_data.get("translated_content", "Translation failed")
    if len(translated_text) > 1024:
        translated_text = translated_text[:1021] + "..."

    embed.add_field(
        name=f"Translation ({target_language})",
        value=f"```{translated_text}```",
        inline=False,
    )

    # Message info
    embed.add_field(
        name="Message Info",
        value=f"**Author:** {original_message.author.mention}\n**Channel:** {original_message.channel.mention}\n**Confidence:** {translation_data.get('confidence', 'Unknown')}",
        inline=False,
    )

    # Footer with command info
    embed.set_footer(
        text=f"Use {Config.BOT_PREFIX}translate to change your target language • Powered by AI"
    )

    # Add thumbnail (author's avatar)
    if original_message.author.avatar:
        embed.set_thumbnail(url=original_message.author.avatar.url)

    try:
        await user.send(embed=embed)
    except discord.errors.Forbidden:
        logger.warning(f"Cannot send DM to user {user.id}")


async def send_error_dm(user: discord.User, error_message: str):
    """Send an error message to the user's DM."""
    embed = discord.Embed(
        title="❌ Translation Error",
        description=error_message,
        color=discord.Color.red(),
    )
    embed.set_footer(text=f"Use {Config.BOT_PREFIX}translate to set up translation")

    try:
        await user.send(embed=embed)
    except discord.errors.Forbidden:
        logger.warning(f"Cannot send error DM to user {user.id}")
    except Exception as e:
        logger.error(f"Error sending error DM: {str(e)}")
