from llm import (
    compress_text,
    beautify_output
)

from gemini_service import (
    generate_from_json
)


def process_document(
    raw_text: str,
    output_type: str
):

    print("Step 1: Compressing")

    compressed_json = compress_text(
        raw_text
    )

    print("Step 2: Gemini")

    gemini_output = generate_from_json(
        compressed_json,
        output_type
    )

    print("Step 3: Beautifying")

    final_output = beautify_output(
        gemini_output
    )

    return {
        "compressed_json": compressed_json,
        "gemini_output": gemini_output,
        "final_output": final_output
    }