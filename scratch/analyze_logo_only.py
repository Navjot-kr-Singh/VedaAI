from PIL import Image

path = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma/Screenshot 2026-05-23 at 12.02.53 AM.png'
img = Image.open(path)

# Let's crop a region around the sidebar top-left header
# The logo starts at x=100 y=72 as found previously.
# Let's crop x from 80 to 220, y from 60 to 180
crop_x1, crop_y1 = 80, 60
crop_x2, crop_y2 = 220, 180
cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))

# The logo icon is a square. Let's find its exact boundary.
# Let's look for the orange/red bounding box on the left.
# The background is white (R > 240, G > 240, B > 240).
# Let's scan columns from left to right to find the logo boundary.
w, h = cropped.size

logo_pixels = []
for x in range(w):
    for y in range(h):
        r, g, b = cropped.getpixel((x, y))[:3]
        # Check for orange/red/dark-red logo colors (R > 80, G < 160)
        # and ignore the light background (R > 240 and G > 240 and B > 240)
        if (r > 80 and g < 160) and not (r > 240 and g > 240 and b > 240):
            logo_pixels.append((x, y))

x_coords = [p[0] for p in logo_pixels]
y_coords = [p[1] for p in logo_pixels]

# The logo icon boundaries
logo_x1, logo_x2 = min(x_coords), max(x_coords)
logo_y1, logo_y2 = min(y_coords), max(y_coords)

logo_w = logo_x2 - logo_x1 + 1
logo_h = logo_y2 - logo_y1 + 1

print(f"Isolated Logo Icon: relative ({logo_x1}, {logo_y1}) to ({logo_x2}, {logo_y2}), size: {logo_w}x{logo_h}")
print(f"Absolute screenshot coordinates: ({crop_x1+logo_x1}, {crop_y1+logo_y1}) to ({crop_x1+logo_x2}, {crop_y1+logo_y2})")

# Let's crop the logo icon itself
logo_icon = cropped.crop((logo_x1, logo_y1, logo_x2 + 1, logo_y2 + 1))
logo_icon.save('/Users/navjotkumarsingh/Desktop/VedaAI/scratch/logo_icon.png')
print("Saved logo icon crop to scratch/logo_icon.png")

# Now let's print the colors along the diagonal from top-left (0,0) to bottom-right (w-1, h-1)
# to see the gradient transition!
iw, ih = logo_icon.size
print("\nGradient Colors along Diagonal:")
for i in range(11):
    frac = i / 10.0
    cx = int(frac * (iw - 1))
    cy = int(frac * (ih - 1))
    
    # We want to sample the background color of the logo icon.
    # If the sampled pixel is part of the white V shape, let's sample from the left edge (e.g. x=5) at the same height.
    r, g, b = logo_icon.getpixel((cx, cy))[:3]
    if r > 240 and g > 240 and b > 240:
        # white V, sample from the left edge of the logo icon
        r, g, b = logo_icon.getpixel((4, cy))[:3]
        print(f"  {frac:.1f}: {r, g, b} (sampled from left edge)")
    else:
        print(f"  {frac:.1f}: {r, g, b}")

# Let's check the text next to the logo
# The text starts after the logo icon.
text_start_x = crop_x1 + logo_x2 + 1
# Let's search for the first black pixel of the text
text_x1 = -1
for x in range(text_start_x, text_start_x + 100):
    for y in range(crop_y1, crop_y1 + h):
        r, g, b = img.getpixel((x, y))[:3]
        if r < 100 and g < 100 and b < 100:
            text_x1 = x
            break
    if text_x1 != -1:
        break

print(f"\nSpacing between logo icon and text: {text_x1 - (crop_x1 + logo_x2)} pixels")
