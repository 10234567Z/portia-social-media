from content_types.ContentAnalyzerTypes import ContentAnalyzerInput
from pydantic import BaseModel
from typing import Type
from utilities.file_loader import load_instructions_file


from portia import (
    Tool,
    ToolRunContext,
    Message,
)



class ContentAnalyzerTool(Tool[str]):
    """
    Analyzes the content input from the user and provides insights or modifications as output
    """
    id: str = "content_analyzer"
    name: str = "Content Analyzer"
    description: str = (
        "A tool to analyze the content based on the provided input. "
        "This tool calls an LLM to generate a well-structured post."
    )
    args_schema: Type[BaseModel] = ContentAnalyzerInput
    output_schema: tuple[str, str] = (
        "json",
        "A JSON object with the following fields: 'content' (str: the generated post content)",
    )

    def run(self, context: ToolRunContext, content: str) -> bool:
        llm = context.config.get_default_model()
        messages = [
            Message(
                role="system",
                content=load_instructions_file("instructions/ContentAnalyzerInstructions.txt"),
            ),
            Message(role="user", content=content),
        ]
        response = llm.get_response(messages)
        return response.content