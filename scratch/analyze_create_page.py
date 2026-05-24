from PIL import Image
import os

image_path1 = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779644846918.png'
image_path2 = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779644868430.png'

for idx, p in enumerate([image_path1, image_path2]):
    if os.path.exists(p):
        img = Image.open(p)
        print(f"Image {idx+1} size: {img.size}")
        
        # Let's sample:
        # 1. Page background (near the top-left or top-right outside the card)
        print(f"  Page background near (10, 10): {img.getpixel((10, 10))[:3]}")
        
        # 2. Card background (center of the card)
        print(f"  Card background near (w//2, h//2): {img.getpixel((img.size[0]//2, img.size[1]//2))[:3]}")
    else:
        print(f"Image {idx+1} not found at {p}")
