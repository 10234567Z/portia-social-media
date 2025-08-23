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
    PlanBuilderV2,
    StepOutput,
)
from portia.cli import CLIExecutionHooks


async def main(content: str) -> dict:

    config = Config.from_default(default_log_level="ERROR")

    tools = DefaultToolRegistry(
            config=config,
        ) + InMemoryToolRegistry.from_local_tools([PostCreationTool()]) + InMemoryToolRegistry.from_local_tools([ScriptCreationTool()]) + InMemoryToolRegistry.from_local_tools([ContentAnalyzerTool()])

    portia = Portia(
        config=config,
        tools=tools,
        execution_hooks=CLIExecutionHooks(),
    )

    plan = (PlanBuilderV2("Create a new social media post, youtube script and analyze the rating of that content").invoke_tool_step(
        step_name="Create a new social media post",
        tool="post_creation",
        args={
            "content": content
        }
    ).invoke_tool_step(
        step_name="Create a new youtube script",
        tool="script_creation",
        args={
            "content": f"Here is the post made at {StepOutput('Create a new social media post')} and the original prompt {content}, generate a Youtube Script for this content."
        }
    ).invoke_tool_step(
        step_name="Analyze the content",
        tool="content_analyzer",
        args={
            "post_content": StepOutput('Create a new social media post'),
            "script_content": StepOutput('Create a new youtube script')
        }
    ).build()
    )
    plan_run = await portia.arun_plan(plan)
    
    return plan_run.outputs.step_outputs


if __name__ == "__main__":
    import asyncio
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--content",
        type=str,
        required=True,
        help="Provide the content you want to generate",
    )

    args = parser.parse_args()
    result = asyncio.run(main(args.content))
