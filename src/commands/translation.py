import discord
from bot import bot

# Simple in-memory storage for user language preferences
# In production, consider using a database
user_languages = {}

SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi",
    "tr": "Turkish",
    "pl": "Polish",
    "nl": "Dutch",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish",
}


class LanguageSelect(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(
                label=f"{name} ({code})",
                value=code,
                description=f"Set your translation language to {name}",
            )
            for code, name in list(SUPPORTED_LANGUAGES.items())[:25]  # Discord limit
        ]
        super().__init__(
            placeholder="Choose your preferred language...", options=options
        )

    async def callback(self, interaction: discord.Interaction):
        user_languages[interaction.user.id] = self.values[0]
        language_name = SUPPORTED_LANGUAGES[self.values[0]]

        embed = discord.Embed(
            title="✅ Language Set Successfully",
            description=f"Your translation language has been set to **{language_name}** (`{self.values[0]}`)",
            color=discord.Color.green(),
        )
        embed.add_field(
            name="How it works:",
            value="• React to any message with 🌐 to get a translation\n• Translation will be sent to your DMs",
            inline=False,
        )

        await interaction.response.edit_message(embed=embed, view=None)


class LanguageView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=300)
        self.add_item(LanguageSelect())

    async def on_timeout(self):
        # Disable the view when it times out
        for item in self.children:
            item.disabled = True


@bot.command(name="translate", aliases=["lang", "language"])
async def set_translation_language(ctx, language_code: str = None):
    """Set your preferred translation language or view current setting."""

    if language_code is None:
        # Show current language and language selector
        current_lang = user_languages.get(ctx.author.id, "en")
        current_lang_name = SUPPORTED_LANGUAGES.get(current_lang, "English")

        embed = discord.Embed(
            title="🌐 Translation Settings",
            description=f"Your current translation language: **{current_lang_name}** (`{current_lang}`)",
            color=discord.Color.blue(),
        )
        embed.add_field(
            name="Change Language",
            value="Use the dropdown below to select a new language, or use `!translate <code>`",
            inline=False,
        )
        embed.add_field(
            name="Supported Languages",
            value="EN, ES, FR, DE, IT, PT, RU, JA, KO, ZH, AR, HI, TR, PL, NL, SV, DA, NO, FI",
            inline=False,
        )
        embed.set_footer(text="React to messages with 🌐 to translate them!")

        view = LanguageView()
        await ctx.send(embed=embed, view=view)
        return

    # Set language directly from command
    language_code = language_code.lower()
    if language_code not in SUPPORTED_LANGUAGES:
        embed = discord.Embed(
            title="❌ Invalid Language Code",
            description=f"Language code `{language_code}` is not supported.",
            color=discord.Color.red(),
        )
        embed.add_field(
            name="Supported Languages",
            value=", ".join([f"`{code}`" for code in SUPPORTED_LANGUAGES.keys()]),
            inline=False,
        )
        await ctx.send(embed=embed)
        return

    user_languages[ctx.author.id] = language_code
    language_name = SUPPORTED_LANGUAGES[language_code]

    embed = discord.Embed(
        title="✅ Language Set Successfully",
        description=f"Your translation language has been set to **{language_name}** (`{language_code}`)",
        color=discord.Color.green(),
    )
    embed.add_field(
        name="How it works:",
        value="• React to any message with 🌐 to get a translation\n• Translation will be sent to your DMs",
        inline=False,
    )

    await ctx.send(embed=embed)


def get_user_language(user_id: int) -> str:
    """Get user's preferred translation language, default to English."""
    return user_languages.get(user_id, "en")
