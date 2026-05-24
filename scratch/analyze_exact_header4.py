import os
from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)
w, h = img.size

# Let's find the exact background color of the navbar capsule.
# Let's sample a few pixels inside the capsule where there are no elements.
# e.g., at x=300, y=30
print(f"Navbar background color at (300, 30): {img.getpixel((300, 30))}")
# Page background color outside the navbar capsule:
# e.g., at x=10, y=4
print(f"Page background color at (10, 4): {img.getpixel((10, 4))}")
print(f"Page background color at (10, h-4): {img.getpixel((10, h-4))}")

# Let's analyze the back button (the circle around the arrow)
# In the original, the back button is a white circle with a border.
# The arrow is inside it.
# Let's find the bounding box of the circular back button.
# Let's search from x=15 to x=70, y=10 to y=58 for a circle border.
# Let's print the color grid of x from 20 to 65, y from 15 to 55 to see where the border is.
# The border is likely gray (e.g. RGB around 230-240).
border_points = []
for x in range(15, 75):
    for y in range(10, 58):
        r, g, b = img.getpixel((x, y))[:3]
        # The border is gray, let's say between 220 and 242
        if 220 <= r <= 242 and 220 <= g <= 242 and 220 <= b <= 242:
            border_points.append((x, y))

if border_points:
    bx_coords = [p[0] for p in border_points]
    by_coords = [p[1] for p in border_points]
    bx1, bx2 = min(bx_coords), max(bx_coords)
    by1, by2 = min(by_coords), max(by_coords)
    print(f"Back Button Circle Border: x={bx1} to {bx2} (width: {bx2 - bx1 + 1}), y={by1} to {by2} (height: {by2 - by1 + 1})")
else:
    print("Could not find back button border by color range")

# Let's do the same for the bell circle border (around x=800 to x=850)
bell_border_points = []
for x in range(800, 850):
    for y in range(10, 58):
        r, g, b = img.getpixel((x, y))[:3]
        if 220 <= r <= 242 and 220 <= g <= 242 and 220 <= b <= 242:
            bell_border_points.append((x, y))

if bell_border_points:
    bl_x = [p[0] for p in bell_border_points]
    bl_y = [p[1] for p in bell_border_points]
    blx1, blx2 = min(bl_x), max(bl_x)
    bly1, bly2 = min(bl_y), max(bl_y)
    print(f"Bell Circle Border: x={blx1} to {blx2} (width: {blx2 - blx1 + 1}), y={bly1} to {bly2} (height: {bly2 - bly1 + 1})")
else:
    print("Could not find bell circle border by color range")

# Let's find the orange notification dot on the bell circle
# Orange color is typically high R, medium G, low B (e.g., R=230+, G=100+, B=50-)
orange_points = []
for x in range(800, 860):
    for y in range(10, 58):
        r, g, b = img.getpixel((x, y))[:3]
        if r > 200 and g < 150 and b < 100:
            orange_points.append((x, y))

if orange_points:
    ox = [p[0] for p in orange_points]
    oy = [p[1] for p in orange_points]
    ox1, ox2 = min(ox), max(ox)
    oy1, oy2 = min(oy), max(oy)
    print(f"Orange Notification Dot: x={ox1} to {ox2} (width: {ox2 - ox1 + 1}), y={oy1} to {oy2} (height: {oy2 - oy1 + 1})")
    print(f"  Exact color of center: {img.getpixel(((ox1+ox2)//2, (oy1+oy2)//2))}")
else:
    print("Could not find orange notification dot")

# Let's locate the user avatar (around x=850 to 900)
# We can scan for its border/circular boundary
avatar_points = []
for x in range(840, 900):
    for y in range(10, 58):
        r, g, b = img.getpixel((x, y))[:3]
        # The background of the ape avatar or the circle border
        # Let's print some colors in this region to understand
        pass

# Let's inspect text colors
# "Assignment" text
print(f"Assignment text pixel color at (110, 34): {img.getpixel((110, 34))}")
# "John Doe" text
# Let's scan around x=920 to 960 for the text "John Doe"
# Let's print some dark pixels in this range to see the exact color
dark_text_pixels = []
for x in range(900, 980):
    for y in range(15, 50):
        r, g, b = img.getpixel((x, y))[:3]
        if r < 100 and g < 100 and b < 100:
            dark_text_pixels.append((r, g, b))
if dark_text_pixels:
    print(f"Sample dark text color (min R, G, B): {min(dark_text_pixels)}")
