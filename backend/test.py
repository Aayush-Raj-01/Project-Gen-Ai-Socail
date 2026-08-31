import torch
import psutil

print("RAM available:",
      round(psutil.virtual_memory().available / 1024**3, 2), "GB")

print("GPU total:",
      round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 2), "GB")