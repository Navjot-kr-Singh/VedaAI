from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)
w, h = img.size

# Let's print horizontal slice at y=34, x from 790 to 860
print("Horizontal slice of bell area at y=34:")
for x in range(790, 860):
    r, g, b = img.getpixel((x, 34))[:3]
    # Check if this pixel belongs to the button border, interior, or exterior
    print(f"x={x}: ({r},{g},{b})")

# Let's print vertical slice at x=825, y from 10 to 58
print("\nVertical slice of bell area at x=825:")
for y in range(10, 58):
    r, g, b = img.getpixel((825, y))[:3]
    print(f"y={y}: ({r},{g},{b})")
