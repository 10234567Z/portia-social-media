from content_types.PostCreationTypes import PostCreationInput
from pydantic import BaseModel
from typing import Type
from utilities.file_loader import load_instructions_file

from portia import (
    Tool,
    ToolRunContext,
    Message,
)



class PostCreationTool(Tool[str]):
    """
    Gets the content input from the user and generate a nice textual post as output
    """
    id: str = "post_creation"
    name: str = "Post Creation"
    description: str = (
        "A tool to create a post based on the provided content. "
        "This tool calls an LLM to generate a well-structured post."
    )
    args_schema: Type[BaseModel] = PostCreationInput
    output_schema: tuple[str, str] = (
        "json",
        "A JSON object with the following fields: 'content' (str: the generated post content)",
    )

    def run(self, context: ToolRunContext, content: str) -> bool:
        llm = context.config.get_default_model()
        messages = [
            Message(
                role="system",
                content=load_instructions_file("instructions/PostGenerationInstructions.txt"),
            ),
            Message(role="user", content=content),
        ]
        response = llm.get_response(messages)
        return response.content