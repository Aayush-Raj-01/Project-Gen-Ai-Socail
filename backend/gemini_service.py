import os

from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_from_json(
    compressed_json: str,
    output_type: str
):

    prompt = f"""
You are an expert content transformation system.

Input JSON:

{compressed_json}

Generate:

{output_type}

Keep facts accurate.
Be concise.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text