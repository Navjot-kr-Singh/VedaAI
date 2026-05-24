import os
from PIL import Image

figma_dir = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma'
files = [f for f in os.listdir(figma_dir) if f.endswith('.png')]

# We look for a region that has the VedaAI logo colors:
# Gradient from orange (approx R=240, G=110, B=60) to burgundy (approx R=120, G=15, B=20)
# and contains white pixels (R=255, G=255, B=255).

for f in files:
    path = os.path.join(figma_dir, f)
    try:
        img = Image.open(path)
        # Let's sample some pixels or check if it's the right image
        width, height = img.size
        # We can check the dimensions first
        print(f"File: {f}, Size: {width}x{height}")
    except Exception as e:
        print(f"Error reading {f}: {e}")
