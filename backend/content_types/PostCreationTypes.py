from pydantic import BaseModel, Field

class PostCreationInput(BaseModel):
    """
    Input parameters for the PostCreation
    """

    content: str = Field(
        description="The content upon which the post would be generated"
    )