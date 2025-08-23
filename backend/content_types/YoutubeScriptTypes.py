from pydantic import BaseModel, Field

class ScriptCreationInput(BaseModel):
    """
    Input parameters for the ScriptCreation
    """

    content: str = Field(
        description="The content upon which the script would be generated"
    )