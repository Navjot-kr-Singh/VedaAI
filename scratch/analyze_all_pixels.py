from PIL import Image

path = '/Users/navjotkumarsingh/Desktop/VedaAI/scratch/exact_logo_icon.png'
img = Image.open(path)
w, h = img.size

# We collect all unique colors that are part of the gradient.
# The gradient is not white (R > 250, G > 250, B > 250) and not background (R > 240, G > 240, B > 240)
gradient_pixels = []
for y in range(h):
    for x in range(w):
        r, g, b = img.getpixel((x, y))[:3]
        if not (r > 240 and g > 240 and b > 240) and not (r > 240 and g > 240 and b < 240): # not white, not yellow bg
            # Let's filter out text and check for the orange/red range
            gradient_pixels.append((r, g, b))

# Let's find the pixel with max R, max G, min R, min G
print("Logo Color Statistics:")
print(f"Total gradient pixels: {len(gradient_pixels)}")

# Sort by R
gradient_pixels_sorted_by_r = sorted(gradient_pixels, key=lambda p: p[0], reverse=True)
print("\nTop 5 highest Red values:")
for i in range(min(5, len(gradient_pixels_sorted_by_r))):
    print(f"  {gradient_pixels_sorted_by_r[i]}")

# Sort by G
gradient_pixels_sorted_by_g = sorted(gradient_pixels, key=lambda p: p[1], reverse=True)
print("\nTop 5 highest Green values:")
for i in range(min(5, len(gradient_pixels_sorted_by_g))):
    print(f"  {gradient_pixels_sorted_by_g[i]}")

# Sort by B
gradient_pixels_sorted_by_b = sorted(gradient_pixels, key=lambda p: p[2])
print("\nTop 5 lowest Blue values:")
for i in range(min(5, len(gradient_pixels_sorted_by_b))):
    print(f"  {gradient_pixels_sorted_by_b[i]}")

# Sort by R-to-B ratio (orange indicator)
gradient_pixels_orange = sorted(gradient_pixels, key=lambda p: p[0] - p[2], reverse=True)
print("\nMost orange pixels:")
for i in range(min(5, len(gradient_pixels_orange))):
    print(f"  {gradient_pixels_orange[i]}")
