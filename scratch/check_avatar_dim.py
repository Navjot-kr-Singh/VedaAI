import os
from PIL import Image

avatar_path = '/Users/navjotkumarsingh/Desktop/VedaAI/frontend/public/ape-avatar.png'
if os.path.exists(avatar_path):
    img = Image.open(avatar_path)
    print(f"Ape avatar image size: {img.size}")
else:
    print("Ape avatar not found in public folder")
