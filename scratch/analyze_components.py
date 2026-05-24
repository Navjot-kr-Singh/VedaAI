import os
from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)
w, h = img.size

# Let's print out vertical slices or look at non-navbar-bg pixels inside y=8 to y=58.
# Navbar bg color is (250, 250, 250). Let's scan each column x from 6 to 1011.
# We'll calculate the number of non-bg pixels in each column.
# A pixel is "non-bg" if it's not (250, 250, 250) (e.g. diff > 5).
non_bg_counts = []
for x in range(w):
    count = 0
    for y in range(8, 59):
        pixel = img.getpixel((x, y))
        r, g, b = pixel[:3]
        # Compare with (250, 250, 250)
        if abs(r - 250) > 5 or abs(g - 250) > 5 or abs(b - 250) > 5:
            count += 1
    non_bg_counts.append((x, count))

# Let's group continuous columns of non-bg pixels to identify the components.
# A component is a region with count > 0, separated by regions of count == 0 (or very low counts).
components = []
in_component = False
start_x = -1
for x, count in non_bg_counts:
    # Use count > 0 as indicating a component column
    is_active = (count > 0)
    if is_active and not in_component:
        in_component = True
        start_x = x
    elif not is_active and in_component:
        in_component = False
        components.append((start_x, x - 1))

# If still in component at the end
if in_component:
    components.append((start_x, w - 1))

print("Detected non-background horizontal components:")
for idx, (x1, x2) in enumerate(components):
    # Let's inspect the bounding box and max height of this component
    comp_pixels = []
    for cx in range(x1, x2 + 1):
        for cy in range(8, 59):
            pixel = img.getpixel((cx, cy))
            r, g, b = pixel[:3]
            if abs(r - 250) > 5 or abs(g - 250) > 5 or abs(b - 250) > 5:
                comp_pixels.append((cx, cy))
    
    if comp_pixels:
        cy_min = min(p[1] for p in comp_pixels)
        cy_max = max(p[1] for p in comp_pixels)
        ch = cy_max - cy_min + 1
        cw = x2 - x1 + 1
        print(f"Component {idx}: x={x1} to {x2} (width: {cw}), y={cy_min} to {cy_max} (height: {ch})")

# Let's print the actual pixel columns to understand the spacings
print("\nFirst 150 columns detailed count:")
for x in range(6, 150):
    print(f"x={x}: {non_bg_counts[x][1]}", end=" | " if x % 10 != 9 else "\n")
print()
