from PIL import Image

path = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma/Screenshot 2026-05-23 at 12.02.53 AM.png'
img = Image.open(path)
w, h = img.size

# Let's locate the top navbar region.
# The navbar is a white rounded capsule floating near the top.
# Let's scan from y=20 to y=200 and x=300 to x=2500 to find the navbar bounds.
# We look for the white card background.
# Since the page background is light gray (e.g. RGB around (246, 246, 246)), the navbar itself is white (RGB around (255, 255, 255)).
# Let's scan along x = 400 for the y range of the navbar.
y_start = -1
y_end = -1
for y in range(20, 300):
    r, g, b = img.getpixel((400, y))[:3]
    if r > 250 and g > 250 and b > 250:
        if y_start == -1:
            y_start = y
    else:
        if y_start != -1 and y_end == -1:
            y_end = y - 1
            break

print(f"Top Navbar Y bounds in screenshot: {y_start} to {y_end}, height: {y_end - y_start + 1} pixels")

# Let's find the X bounds of the navbar.
# Scan horizontally along y = (y_start + y_end) // 2
x_start = -1
x_end = -1
for x in range(300, w):
    r, g, b = img.getpixel((x, (y_start + y_end) // 2))[:3]
    if r > 250 and g > 250 and b > 250:
        if x_start == -1:
            x_start = x
    else:
        if x_start != -1 and x_end == -1:
            x_end = x - 1
            break

print(f"Top Navbar X bounds: {x_start} to {x_end}, width: {x_end - x_start + 1} pixels")

# Let's calculate CSS values (2x retina scale division by 2)
print(f"\nCSS Values:")
print(f"  Navbar Height: {(y_end - y_start + 1) / 2.0}px")
print(f"  Navbar Width: {(x_end - x_start + 1) / 2.0}px")

# Let's scan the left items in the navbar:
# Circular back button:
# It starts at the left of the white navbar.
# Let's scan pixels from x_start to x_start + 150 to find the circular back button bounds.
back_pixels = []
for x in range(x_start, x_start + 150):
    for y in range(y_start, y_end):
        r, g, b = img.getpixel((x, y))[:3]
        # Look for the gray border of the back button (border is not white and not page bg)
        # Border of circular button is approx (234, 234, 234) or similar.
        # Inside the button is white. The border is a circle.
        # Let's find where R, G, B are less than 240 (excluding the icon which is dark)
        if 200 < r < 240 and 200 < g < 240 and 200 < b < 240:
            back_pixels.append((x, y))

if back_pixels:
    bx_coords = [p[0] for p in back_pixels]
    by_coords = [p[1] for p in back_pixels]
    bx1, bx2 = min(bx_coords), max(bx_coords)
    by1, by2 = min(by_coords), max(by_coords)
    bw = bx2 - bx1 + 1
    bh = by2 - by1 + 1
    print(f"\nBack Button bounding box: ({bx1}, {by1}) to ({bx2}, {by2}), size: {bw}x{bh}")
    print(f"  CSS Diameter: {bw / 2.0}px")
    print(f"  CSS Left Margin: {(bx1 - x_start) / 2.0}px")
