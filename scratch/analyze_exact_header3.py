import os
from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'

if not os.path.exists(image_path):
    print(f"Error: image not found at {image_path}")
    exit(1)

img = Image.open(image_path)
w, h = img.size
print(f"Image dimensions: {w}x{h}")

# Let's scan vertically at x = w // 2 for white/light colors
navbar_ys = []
for y in range(h):
    r, g, b = img.getpixel((w // 2, y))[:3]
    if r > 248 and g > 248 and b > 248:
        navbar_ys.append(y)

if navbar_ys:
    y_min, y_max = min(navbar_ys), max(navbar_ys)
    nav_h = y_max - y_min + 1
    print(f"Navbar vertical range: y={y_min} to y={y_max} (Height: {nav_h}px, CSS: {nav_h/2}px)")
else:
    print("Could not find navbar background at center column")

navbar_xs = []
# Let's scan horizontally at y = (y_min + y_max) // 2 (or a reasonable middle row)
mid_y = (min(navbar_ys) + max(navbar_ys)) // 2 if navbar_ys else h // 2
for x in range(w):
    r, g, b = img.getpixel((x, mid_y))[:3]
    if r > 248 and g > 248 and b > 248:
        navbar_xs.append(x)

if navbar_xs:
    x_min, x_max = min(navbar_xs), max(navbar_xs)
    nav_w = x_max - x_min + 1
    print(f"Navbar horizontal range: x={x_min} to x={x_max} (Width: {nav_w}px, CSS: {nav_w/2}px)")
    print(f"Page background color near top-left: {img.getpixel((10, 10))[:3]}")
    print(f"Navbar background color at center: {img.getpixel((w // 2, mid_y))[:3]}")
else:
    print("Could not find navbar horizontal bounds")
