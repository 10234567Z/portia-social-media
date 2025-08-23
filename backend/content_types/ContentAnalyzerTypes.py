import argparse
import json

from pydantic import BaseModel, Field

class ContentAnalyzerInput(BaseModel):
    """
    Input parameters for the ContentAnalyzer
    """

    content: str = Field(
        description="The content upon which the analysis would be performed"
    )