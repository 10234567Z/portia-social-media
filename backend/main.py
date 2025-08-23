import argparse
import json
from typing import Type
from tools.ContentAnalyzer import ContentAnalyzerTool
from tools.PostCreation import PostCreationTool
from dotenv import load_dotenv
from tools.YoutubeScript import ScriptCreationTool

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


def main(content: str):
    with open("inbox.txt", "w") as f:
        f.write(content)

    config = Config.from_default(default_log_level="INFO")

    tools = DefaultToolRegistry(
            config=config,
        ) + InMemoryToolRegistry.from_local_tools([PostCreationTool()]) + InMemoryToolRegistry.from_local_tools([ScriptCreationTool()]) + InMemoryToolRegistry.from_local_tools([ContentAnalyzerTool()])

    portia = Portia(
        config=config,
        tools=tools,
        execution_hooks=CLIExecutionHooks(),
    )
    planning_prompt = f"""
    1. Use post_creation tool to generate a social media post
    2. Use script_creation tool to generate a YouTube script  
    3. Use content_analyzer tool to evaluate both pieces of content: {content}
    """

    plan = portia.plan(planning_prompt)
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
        help="Provide the content you want to generate",
    )

    args = parser.parse_args()
    main(args.content)