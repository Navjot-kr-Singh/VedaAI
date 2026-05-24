from PIL import Image

logo_icon = Image.open('/Users/navjotkumarsingh/Desktop/VedaAI/scratch/figma_logo_square.png')
w, h = logo_icon.size

# Let's print colors along the diagonal from top-left (0,0) to bottom-right (w-1, h-1)
# If a pixel is white (part of the V), we'll sample from x=4 at the same height.
print("Diagonal gradient colors of original Figma logo square:")
for i in range(11):
    frac = i / 10.0
    cx = int(frac * (w - 1))
    cy = int(frac * (h - 1))
    r, g, b = logo_icon.getpixel((cx, cy))[:3]
    if r > 230 and g > 230 and b > 230:
        bg_r, bg_g, bg_b = logo_icon.getpixel((6, cy))[:3]
        print(f"  {frac:.1f}: {bg_r, bg_g, bg_b} (sampled from left edge)")
    else:
        print(f"  {frac:.1f}: {r, g, b}")

# Let's check some extreme colors
print("\nColor samples:")
print(f"  Top-left (4, 4): {logo_icon.getpixel((4, 4))[:3]}")
print(f"  Top-right (w-5, 4): {logo_icon.getpixel((w-5, 4))[:3]}")
print(f"  Bottom-left (4, h-5): {logo_icon.getpixel((4, h-5))[:3]}")
print(f"  Bottom-right (w-5, h-5): {logo_icon.getpixel((w-5, h-5))[:3]}")

# Let's also scan the top edge and left edge to see if there is a highlight or shadow:
print("\nTop-left highlight search:")
# In many logos, there is a highlight at the top-left edge. Let's print some pixels:
for x in range(0, 15):
    print(f"  x={x}, y=4: {logo_icon.getpixel((x, 4))[:3]}")
