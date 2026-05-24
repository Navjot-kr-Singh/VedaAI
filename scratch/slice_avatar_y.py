from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)

print("Vertical slice at x=880:")
for y in range(10, 58):
    r, g, b = img.getpixel((880, y))[:3]
    print(f"y={y}: ({r},{g},{b})")
