from PIL import Image
import os

path = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma/Screenshot 2026-05-23 at 12.02.53 AM.png'
img = Image.open(path)

# Crop region
crop_x1, crop_y1 = 80, 50
crop_x2, crop_y2 = 220, 180
cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))

width, height = cropped.size

# Find bounds of logo icon
logo_pixels = []
for y in range(height):
    for x in range(width):
        r, g, b = cropped.getpixel((x, y))[:3]
        # Any pixel that isn't white/light-gray background
        if r < 240 or g < 240 or b < 240:
            logo_pixels.append((x, y))

if not logo_pixels:
    print("Logo not found!")
    exit(1)

x_coords = [p[0] for p in logo_pixels]
y_coords = [p[1] for p in logo_pixels]

x1, x2 = min(x_coords), max(x_coords)
y1, y2 = min(y_coords), max(y_coords)

w = x2 - x1 + 1
h = y2 - y1 + 1
print(f"Exact logo icon bounding box relative to crop: ({x1}, {y1}) to ({x2}, {y2}), size: {w}x{h}")
logo_abs_x2 = crop_x1 + x2

# Sample diagonal background colors (avoiding the white V in the center)
print("\nDiagonal gradient colors:")
logo_crop = cropped.crop((x1, y1, x2, y2))
for i in range(11):
    frac = i / 10.0
    cx = int(frac * (w - 1))
    cy = int(frac * (h - 1))
    r, g, b = logo_crop.getpixel((cx, cy))[:3]
    # If it's a white pixel (part of the V), sample from the left/right edge
    if r > 240 and g > 240 and b > 240:
        r, g, b = logo_crop.getpixel((4, cy))[:3]
        print(f"  {frac:.1f}: {r, g, b} (sampled from left edge)")
    else:
        print(f"  {frac:.1f}: {r, g, b}")

# Print corner colors
print("\nCorner colors:")
print(f"  Top-left (4, 4): {logo_crop.getpixel((4, 4))[:3]}")
print(f"  Top-right (w-5, 4): {logo_crop.getpixel((w-5, 4))[:3]}")
print(f"  Bottom-left (4, h-5): {logo_crop.getpixel((4, h-5))[:3]}")
print(f"  Bottom-right (w-5, h-5): {logo_crop.getpixel((w-5, h-5))[:3]}")

# Text region
text_region_x1 = logo_abs_x2 + 2
text_region_x2 = text_region_x1 + 350
text_region_y1 = crop_y1 + y1 - 20
text_region_y2 = crop_y1 + y2 + 20

text_crop = img.crop((text_region_x1, text_region_y1, text_region_x2, text_region_y2))
tw, th = text_crop.size

text_pixels = []
for y in range(th):
    for x in range(tw):
        r, g, b = text_crop.getpixel((x, y))[:3]
        if r < 100 and g < 100 and b < 100:
            text_pixels.append((x, y))

if text_pixels:
    tx_coords = [p[0] for p in text_pixels]
    ty_coords = [p[1] for p in text_pixels]
    tx1, tx2 = min(tx_coords), max(tx_coords)
    ty1, ty2 = min(ty_coords), max(ty_coords)
    
    print(f"\nText bounding box: ({tx1}, {ty1}) to ({tx2}, {ty2}), size: {tx2-tx1+1}x{ty2-ty1+1}")
    print(f"Spacing between logo icon and text: {tx1 + 2} pixels")
    print(f"Text color (sampled): {text_crop.getpixel((tx1+5, ty1+5))[:3]}")
else:
    print("\nText not found in the region!")
