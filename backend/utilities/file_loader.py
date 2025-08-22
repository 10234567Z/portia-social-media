import os 
def load_instructions_file(filename: str, default: str = ""):
    """
    Loads the content of a file if it exists, otherwise returns a default value.
    
    Args:
        filename (str): The path to the file to load.
        default (str): The default value to return if the file does not exist.
        
    Returns:
        str: The content of the file or the default value.
    """
    if os.path.exists(filename):
        with open(filename, 'r', encoding="utf-8") as file:
            return file.read()
    return default