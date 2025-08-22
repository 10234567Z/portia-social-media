from content_types.VideoCreationTypes import VideoAgentInput
from typing import Type
from pydantic import BaseModel

from portia import (
    Tool,
    ToolRunContext,
    Message,
)
import torch
from diffusers import LTXPipeline
from diffusers.utils import export_to_video



class VideoCreationTool(Tool):
    """
    Creates actual MP4 video files from text prompts using AI video generation
    """
    id: str = "video_creation"
    name: str = "AI Video Generator"
    description: str = (
        "Generates actual MP4 video files from text descriptions using AI video generation models. "
        "Takes a text prompt and creates a real video file (output.mp4) with visual content matching the description."
    )
    args_schema: Type[BaseModel] = VideoAgentInput
    output_schema: tuple[str, str] = (
        "str", 
        "Path to the generated MP4 video file"
    )

    def run(self, context: ToolRunContext, content: str) -> str:
        pipeline = LTXPipeline.from_pretrained(
        "Lightricks/LTX-Video", torch_dtype=torch.bfloat16
        ).to("cuda")

        video = pipeline(
            prompt=content,
            negative_prompt="""""",
            width=768,
            height=512,
            num_frames=161,
            decode_timestep=0.03,
            decode_noise_scale=0.025,
            num_inference_steps=50,
        ).frames[0]
        export_to_video(video, "output.mp4", fps=24)

        return "output.mp4"