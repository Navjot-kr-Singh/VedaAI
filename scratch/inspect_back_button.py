from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)

print("Horizontal slice of back button at y=34:")
for x in range(15, 75):
    r, g, b = img.getpixel((x, 34))[:3]
    print(f"x={x}: ({r},{g},{b})")

print("\nVertical slice of back button at x=45:")
for y in range(10, 58):
    r, g, b = img.getpixel((45, y))[:3]
    print(f"y={y}: ({r},{g},{b})")
