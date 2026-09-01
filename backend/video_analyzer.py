"""
Video Analyzer Module
=====================

Extracts multi-modal data from video files.
Uses:
 - faster-whisper (Speech)
 - YOLOv8 (Object Detection)
 - BLIP (Visual Captioning)
 - EasyOCR (Text Recognition)
"""

import os
import cv2
import json
import torch
import gc
from PIL import Image
from moviepy import VideoFileClip
from faster_whisper import WhisperModel
from ultralytics import YOLO
import easyocr
from transformers import BlipProcessor, BlipForConditionalGeneration

class CompleteVideoAnalyzer:
    def __init__(self):
        print("[video_analyzer] Initializing Hardware and Models...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")

        comp_type = "float16" if self.device == "cuda" else "float32"
        self.whisper_model = WhisperModel("base", device=self.device, compute_type=comp_type)
        self.yolo_model = YOLO("yolov8n.pt") 
        self.blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(self.device)
        
        gpu_bool = True if self.device == "cuda" else False
        self.ocr_reader = easyocr.Reader(['en'], gpu=gpu_bool)

        print("[video_analyzer] Initialization complete. All systems ready.\n")

    def process(self, video_path):
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")

        print(f"[video_analyzer] Starting analysis for: {video_path}")
        temp_audio_path = "temp_extracted_audio.wav"

        # --- PHASE 1: AUDIO PROCESSING ---
        print("\n--- Phase 1: Processing Audio & Speech Detection ---")
        try:
            video_clip = VideoFileClip(video_path)
            if video_clip.audio is not None:
                video_clip.audio.write_audiofile(temp_audio_path, logger=None)
                video_clip.close()

                segments, info = self.whisper_model.transcribe(temp_audio_path, beam_size=5)
                speech_data = []
                for segment in segments:
                    speech_data.append({
                        "start": round(segment.start, 2),
                        "end": round(segment.end, 2),
                        "text": segment.text.strip()
                    })
                print(f"Detected language: '{info.language}' with confidence {info.language_probability:.2f}")
            else:
                print("No audio track detected.")
                speech_data = []
                video_clip.close()
        except Exception as e:
            print(f"Audio processing skipped or failed: {e}")
            speech_data = []

        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

        # --- PHASE 2: VISUAL & TEXT PROCESSING ---
        print("\n--- Phase 2: Processing Frames (Visual & OCR Data) ---")
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if fps == 0 or total_frames == 0:
            print("Error: Could not read video properties.")
            return {"error": "Could not read video"}

        duration = total_frames / fps
        print(f"Video Meta: {duration:.2f}s total runtime | {fps:.2f} FPS")

        frame_analysis_timeline = []
        current_second = 0

        while cap.isOpened():
            frame_id = int(current_second * fps)
            if frame_id >= total_frames:
                break

            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_id)
            success, frame = cap.read()
            if not success:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_frame)

            yolo_results = self.yolo_model(frame, verbose=False)[0]
            detected_objects = []
            for box in yolo_results.boxes:
                class_id = int(box.cls[0])
                label = self.yolo_model.names[class_id]
                confidence = float(box.conf[0])
                if confidence > 0.4:
                    detected_objects.append(label)
            detected_objects = list(set(detected_objects))

            inputs = self.blip_processor(images=pil_image, return_tensors="pt").to(self.device)
            if self.device == "cuda":
                inputs = {k: v.to(dtype=torch.float16) if v.dtype == torch.float32 else v for k, v in inputs.items()}
            caption_ids = self.blip_model.generate(**inputs)
            action_description = self.blip_processor.decode(caption_ids[0], skip_special_tokens=True)

            ocr_results = self.ocr_reader.readtext(frame)
            detected_text_elements = []
            for (_, text, conf) in ocr_results:
                if conf > 0.3:
                    detected_text_elements.append(text.strip())
            joined_ocr_text = " ".join(detected_text_elements)

            frame_analysis_timeline.append({
                "timestamp_second": current_second,
                "objects_inside": detected_objects,
                "action_happening": action_description,
                "text_written": joined_ocr_text
            })

            current_second += 1

        cap.release()
        print(f"\nVisual processing complete. Processed {current_second} intervals.")

        final_report = {
            "video_source": os.path.basename(video_path),
            "total_duration_seconds": round(duration, 2),
            "speech_transcript": speech_data,
            "visual_timeline": frame_analysis_timeline
        }
        return final_report


# ---------------------------------------------------------------------------
# Global Cache & Public API
# ---------------------------------------------------------------------------
_analyzer_instance = None

def _get_analyzer():
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = CompleteVideoAnalyzer()
    return _analyzer_instance

def unload_video_analyzer():
    global _analyzer_instance
    if _analyzer_instance is not None:
        del _analyzer_instance
        _analyzer_instance = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print("[video_analyzer] Models unloaded — VRAM freed.")

def analyze_video(video_path: str) -> dict:
    analyzer = _get_analyzer()
    report = analyzer.process(video_path)
    
    # Cleanup video file
    try:
        os.remove(video_path)
    except OSError as e:
        print(f"[video_analyzer] Cleanup warning: {e}")
        
    return report
