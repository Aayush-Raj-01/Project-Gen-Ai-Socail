from PIL import Image
import torch
import os
import easyocr
from transformers import AutoProcessor, Florence2ForConditionalGeneration

# ==================================================
# CONFIGURATION
# ==================================================

MODEL_ID = "florence-community/Florence-2-base"

device = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Using device: {device}")

# ==================================================
# LOAD FLORENCE-2
# ==================================================

print("Loading Florence-2...")

model = Florence2ForConditionalGeneration.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32
).to(device)

processor = AutoProcessor.from_pretrained(MODEL_ID)

# ==================================================
# IMAGE PATH
# ==================================================

script_dir = os.path.dirname(os.path.abspath(__file__))

image_path = os.path.join(script_dir, "AC.png")

if not os.path.exists(image_path):
    raise FileNotFoundError(f"Image not found: {image_path}")

image = Image.open(image_path).convert("RGB")

# ==================================================
# FLORENCE HELPER
# ==================================================

def run_florence_task(prompt):

    inputs = processor(
        text=prompt,
        images=image,
        return_tensors="pt"
    )

    if device == "cuda":
        inputs = {
            k: v.to(device).half() if v.dtype == torch.float else v.to(device)
            for k, v in inputs.items()
        }
    else:
        inputs = {
            k: v.to(device)
            for k, v in inputs.items()
        }

    generated_ids = model.generate(
        **inputs,
        max_new_tokens=1024,
        num_beams=3
    )

    generated_text = processor.batch_decode(
        generated_ids,
        skip_special_tokens=False
    )[0]

    result = processor.post_process_generation(
        generated_text,
        task=prompt,
        image_size=image.size
    )

    return result

# ==================================================
# IMAGE DESCRIPTION
# ==================================================

print("Generating image description...")

description_result = run_florence_task(
    "<MORE_DETAILED_CAPTION>"
)

description = description_result[
    "<MORE_DETAILED_CAPTION>"
]

# ==================================================
# EASYOCR
# ==================================================

print("Loading EasyOCR...")

try:
    reader = easyocr.Reader(
    ['en', 'hi'],
    gpu=torch.cuda.is_available()
)
except Exception as e:
    print("Failed to initialize EasyOCR")
    print(e)
    exit()

print("Extracting text...")

results = reader.readtext(image_path)

all_text = []

for bbox, text, confidence in results:
    all_text.append(
        f"{text} (confidence: {confidence:.2f})"
    )

ocr_text = "\n".join(all_text)

# ==================================================
# SAVE REPORT
# ==================================================

output_file = os.path.join(
    script_dir,
    "image_details.txt"
)

with open(output_file, "w", encoding="utf-8") as f:

    f.write("=" * 60 + "\n")
    f.write("IMAGE DESCRIPTION\n")
    f.write("=" * 60 + "\n\n")

    f.write(description)

    f.write("\n\n")

    f.write("=" * 60 + "\n")
    f.write("TEXT FOUND IN IMAGE\n")
    f.write("=" * 60 + "\n\n")

    if ocr_text.strip():
        f.write(ocr_text)
    else:
        f.write("No text detected.")

print("\nDone!")
print(f"Saved report to:\n{output_file}")