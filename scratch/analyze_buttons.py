from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)
w, h = img.size

# Back button is a circle. Let's find the white circle.
# Let's count white pixels (255, 255, 255) in the region x: 15 to 80, y: 10 to 58.
white_pixels = []
for x in range(15, 80):
    for y in range(10, 58):
        r, g, b = img.getpixel((x, y))[:3]
        if r > 253 and g > 253 and b > 253:
            white_pixels.append((x, y))

if white_pixels:
    x_coords = [p[0] for p in white_pixels]
    y_coords = [p[1] for p in white_pixels]
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    print(f"Back button white pixels bounding box: x={x_min} to {x_max} (width: {x_max-x_min+1}), y={y_min} to {y_max} (height: {y_max-y_min+1})")
else:
    print("No white pixels found for back button")

# Bell button is also a circle. Let's check for white pixels in region x: 800 to 860, y: 10 to 58.
bell_white_pixels = []
for x in range(800, 860):
    for y in range(10, 58):
        r, g, b = img.getpixel((x, y))[:3]
        if r > 253 and g > 253 and b > 253:
            # But the orange dot is there, and bell icon itself is dark.
            bell_white_pixels.append((x, y))

if bell_white_pixels:
    x_coords = [p[0] for p in bell_white_pixels]
    y_coords = [p[1] for p in bell_white_pixels]
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    print(f"Bell button white pixels bounding box: x={x_min} to {x_max} (width: {x_max-x_min+1}), y={y_min} to {y_max} (height: {y_max-y_min+1})")
else:
    print("No white pixels found for bell button")

# Let's inspect the avatar circle region (x: 860 to 920)
# Let's find the bounding box of the avatar
avatar_pixels = []
for x in range(860, 920):
    for y in range(10, 58):
        r, g, b = img.getpixel((x, y))[:3]
        # The background of the avatar circle in the reference image (ape-avatar)
        # Let's find where the pixel is not the navbar bg
        if abs(r - 250) > 5 or abs(g - 250) > 5 or abs(b - 250) > 5:
            avatar_pixels.append((x, y))

if avatar_pixels:
    x_coords = [p[0] for p in avatar_pixels]
    y_coords = [p[1] for p in avatar_pixels]
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    print(f"Avatar bounding box: x={x_min} to {x_max} (width: {x_max-x_min+1}), y={y_min} to {y_max} (height: {y_max-y_min+1})")
else:
    print("No avatar pixels found")
