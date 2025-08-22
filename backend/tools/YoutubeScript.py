from pydantic import BaseModel
from typing import Type
from content_types.YoutubeScriptTypes import ScriptCreationInput
from utilities.file_loader import load_instructions_file

from portia import (
    Tool,
    ToolRunContext,
    Message,
)



class ScriptCreationTool(Tool[str]):
    """
    Gets the content input from the user and generate a nice textual script as output
    """
    id: str = "script_creation"
    name: str = "Script Creation"
    description: str = (
        "A tool to create a script of youtube based on the provided content. "
        "This tool is used to generate a well-structured script."
    )
    args_schema: Type[BaseModel] = ScriptCreationInput
    output_schema: tuple[str, str] = (
        "json",
        "A JSON object with the following fields: 'content' (str: the generated script content)",
    )

    def run(self, context: ToolRunContext, content: str) -> bool:
        llm = context.config.get_default_model()
        messages = [
            Message(
                role="system",
                content=load_instructions_file("instructions/ScriptGenerationInstructions.txt"),
            ),
            Message(role="user", content=content),
        ]
        response = llm.get_response(messages)
        return response.content