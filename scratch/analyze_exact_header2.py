from PIL import Image

path = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma/Screenshot 2026-05-23 at 12.02.53 AM.png'
img = Image.open(path)
w, h = img.size

# Let's start scanning from x = 800 (well inside the main area to avoid the sidebar)
# Scan vertically at x = 1200 for the top navbar bounds.
# The navbar is a white capsule on the gray background.
y_start = -1
y_end = -1
for y in range(10, 300):
    r, g, b = img.getpixel((1200, y))[:3]
    # White background of the navbar
    if r > 250 and g > 250 and b > 250:
        if y_start == -1:
            y_start = y
    else:
        if y_start != -1 and y_end == -1:
            y_end = y - 1
            break

print(f"Top Navbar Y bounds in screenshot: {y_start} to {y_end}, height: {y_end - y_start + 1} pixels")

# Let's find the horizontal (X) bounds of this navbar capsule.
# Scan horizontally along y = (y_start + y_end) // 2
x_start = -1
x_end = -1
for x in range(600, w):
    r, g, b = img.getpixel((x, (y_start + y_end) // 2))[:3]
    if r > 250 and g > 250 and b > 250:
        if x_start == -1:
            x_start = x
    else:
        if x_start != -1 and x_end == -1:
            x_end = x - 1
            break

print(f"Top Navbar X bounds: {x_start} to {x_end}, width: {x_end - x_start + 1} pixels")

# CSS values
css_h = (y_end - y_start + 1) / 2.0
css_w = (x_end - x_start + 1) / 2.0
print(f"\nCSS Values:")
print(f"  Navbar Height: {css_h}px")
print(f"  Navbar Width: {css_w}px")

# Let's find the circular back button inside the navbar.
# It starts at the left of the navbar (around x_start).
# Let's scan from x_start to x_start + 150.
# The back button has a gray border (not white R > 250 and not page bg R < 240).
# Let's scan for non-white, non-gray pixels that form the border.
# The border color is around (230, 230, 230). Let's print the bounding box of the circular back button.
back_pixels = []
for x in range(x_start, x_start + 150):
    for y in range(y_start, y_end):
        r, g, b = img.getpixel((x, y))[:3]
        if 200 < r < 242 and 200 < g < 242 and 200 < b < 242:
            back_pixels.append((x, y))

if back_pixels:
    bx_coords = [p[0] for p in back_pixels]
    by_coords = [p[1] for p in back_pixels]
    bx1, bx2 = min(bx_coords), max(bx_coords)
    by1, by2 = min(by_coords), max(by_coords)
    bw = bx2 - bx1 + 1
    bh = by2 - by1 + 1
    print(f"\nBack Button bounding box in screenshot: ({bx1}, {by1}) to ({bx2}, {by2}), size: {bw}x{bh}")
    print(f"  CSS Diameter: {bw / 2.0}px")
    print(f"  CSS Left Padding: {(bx1 - x_start) / 2.0}px")
    print(f"  CSS Top Padding: {(by1 - y_start) / 2.0}px")
