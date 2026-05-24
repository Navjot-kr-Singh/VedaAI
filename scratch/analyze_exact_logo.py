from PIL import Image

path = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma/Screenshot 2026-05-23 at 12.02.53 AM.png'
img = Image.open(path)

# Crop the exact 80x80 logo icon
logo_x1, logo_y1 = 81, 72
logo_x2, logo_y2 = 161, 152
logo_icon = img.crop((logo_x1, logo_y1, logo_x2, logo_y2))
logo_icon.save('/Users/navjotkumarsingh/Desktop/VedaAI/scratch/exact_logo_icon.png')
print("Saved exact logo icon to scratch/exact_logo_icon.png")

w, h = logo_icon.size
print(f"Logo Size: {w}x{h}")

# Print colors along the diagonal from top-left (0,0) to bottom-right (w-1, h-1)
# Let's sample colors directly along the diagonal.
# We will print the colors of the background.
# Since the white V is in the center, we'll sample from the left/right edge for those y coordinates.
print("\nDiagonal gradient colors:")
for i in range(11):
    frac = i / 10.0
    cx = int(frac * (w - 1))
    cy = int(frac * (h - 1))
    r, g, b = logo_icon.getpixel((cx, cy))[:3]
    # Check if this pixel is white (V cutout)
    # The V is white, let's check if it's very bright (R > 230, G > 230, B > 230)
    if r > 230 and g > 230 and b > 230:
        # Sample background color from the left edge of the icon
        # In an 80x80 icon, x=6 is safe from the V
        bg_r, bg_g, bg_b = logo_icon.getpixel((8, cy))[:3]
        print(f"  {frac:.1f}: {bg_r, bg_g, bg_b} (sampled from left edge, diagonal was white {r, g, b})")
    else:
        print(f"  {frac:.1f}: {r, g, b}")

# Let's also print the corners
print("\nExact corner pixels:")
print(f"  Top-left (0,0): {logo_icon.getpixel((0,0))[:3]}")
print(f"  Top-left inner (10,10): {logo_icon.getpixel((10,10))[:3]}")
print(f"  Bottom-right (79,79): {logo_icon.getpixel((79,79))[:3]}")
print(f"  Bottom-right inner (69,69): {logo_icon.getpixel((69,69))[:3]}")
