"""Check what DynamicCache.layers contains after a forward pass."""
from transformers.cache_utils import DynamicCache
import torch

c = DynamicCache()
# Simulate update
key = torch.randn(1, 4, 5, 64)  # batch, heads, seq_len, head_dim
value = torch.randn(1, 4, 5, 64)
c.update(key, value, layer_idx=0)
c.update(torch.randn(1, 4, 5, 64), torch.randn(1, 4, 5, 64), layer_idx=1)

print(f"len(layers) = {len(c.layers)}")
print(f"type(layers[0]) = {type(c.layers[0])}")
print(f"layers[0] = {c.layers[0]}")

# Check if layers[0] is a tuple of (key, value)
layer = c.layers[0]
if hasattr(layer, 'key'):
    print(f"layer.key.shape = {layer.key.shape}")
    print(f"layer.value.shape = {layer.value.shape}")
elif isinstance(layer, tuple):
    print(f"layer[0].shape = {layer[0].shape}")
    print(f"layer[1].shape = {layer[1].shape}")
else:
    print(f"dir(layer) = {[a for a in dir(layer) if not a.startswith('_')]}")
