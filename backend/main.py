import argparse
import json
from typing import Type
from dotenv import load_dotenv
from file_loader import load_instructions_file

from portia import (
    DefaultToolRegistry,
    InMemoryToolRegistry,
    Portia,
    Config,
    Tool,
    ToolHardError,
    ToolRunContext,
    Message,
)
from portia.cli import CLIExecutionHooks
from pydantic import BaseModel, Field
from portia.execution_hooks import clarify_on_tool_calls


class ScamDetectorInput(BaseModel):
    """Input for the ScamDetectorTool."""

    content: str = Field(
        description="The content to analyze for scam detection"
    )

class ScamDetectorTool(Tool[str]):
    """
    A tool to detect potential scams in a given text.
    This tool calls an LLM to analyze the content and identify any signs of scams.

    - If a scam is detected, the tool will return a detailed report outlining the findings.
    - If no scam is detected, the tool will return a message indicating that the content is clean.
    - If the LLM encounters an error while processing the request, it will return an error message.

    """
    id: str = "scam_detector"
    name: str = "Scam Detector"
    description: str = (
        "A tool to detect potential scams in a given text. "
        "This tool calls an LLM to analyze the content and identify any signs of scams."
    )
    args_schema: Type[BaseModel] = ScamDetectorInput
    output_schema: tuple[str, str] = (
        "json",
        "A JSON object with the following fields: 'verdict' (str: 'SCAM' or 'SUSPICIOUS' or 'SAFE'), 'description' (str: the reason for the decision)",
    )

    def run(self, context: ToolRunContext, content: str) -> bool:
        llm = context.config.get_default_model()
        messages = [
            Message(
                role="system",
                content=load_instructions_file("instructions.txt"),
            ),
            Message(role="user", content=content),
        ]
        response = llm.get_response(messages)
        return response.content


def main(content: str):
    with open("inbox.txt", "w") as f:
        f.write(content)

    config = Config.from_default(default_log_level="INFO")

    tools = DefaultToolRegistry(
        config=config,
    ) + InMemoryToolRegistry.from_local_tools([ScamDetectorTool()])

    portia = Portia(
        config=config,
        tools=tools,
        execution_hooks=CLIExecutionHooks(),
    )
    plan = portia.plan(content)
    print("Plan:")
    print(plan.pretty_print())
    portia.run_plan(plan)


if __name__ == "__main__":
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--content",
        type=str,
        required=True,
        help="Provide the content you want to detect the scam risk on",
    )

    args = parser.parse_args()
    main(args.content)