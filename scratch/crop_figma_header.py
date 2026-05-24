from PIL import Image

path = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma/Screenshot 2026-05-23 at 12.02.53 AM.png'
img = Image.open(path)
w, h = img.size

# The header is at the top of the main area.
# Let's crop x: 600 to 2200, y: 50 to 250
header_crop = img.crop((600, 50, 2200, 250))
header_crop.save('/Users/navjotkumarsingh/Desktop/VedaAI/scratch/figma_header_crop.png')
print("Saved header crop to scratch/figma_header_crop.png")
