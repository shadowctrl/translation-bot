import json
import openai
from typing import List
from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str = Field(..., description="Role of the user (user/system)")
    content: str = Field(..., description="Content of the message")


class LLM:
    def __init__(self, api_key: str, base_url: str = None) -> None:
        self.client = openai.OpenAI(api_key=api_key, base_url=base_url)

    def invoke(self, inputs: List[Message], model: str, **kwargs) -> str:
        response = self.client.chat.completions.create(
            model=model,
            messages=[{"role": msg.role, "content": msg.content} for msg in inputs],
            **kwargs,
        )
        return response

    def structured_output(
        self,
        system_prompt: str,
        input: Message,
        model: str,
        response_format: dict,
        **kwargs,
    ) -> dict:
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": input.role, "content": input.content},
            ],
            response_format=response_format,
            **kwargs,
        )
        return json.loads(response.choices[0].message.content)
