from PIL import Image

path = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma/Screenshot 2026-05-23 at 12.01.28 AM.png'
img = Image.open(path)
w, h = img.size

# We look for the orange-red rounded square boundary.
# Orange-red background colors have R > 100, G < 140, B < 80.
# We will scan pixels inside (50 to 300, 50 to 300) and find the exact min/max x and y.
square_pixels = []
for x in range(50, 300):
    for y in range(50, 300):
        r, g, b = img.getpixel((x, y))[:3]
        if r > 100 and g < 140 and b < 80:
            square_pixels.append((x, y))

if square_pixels:
    x_coords = [p[0] for p in square_pixels]
    y_coords = [p[1] for p in square_pixels]
    
    x1, x2 = min(x_coords), max(x_coords)
    y1, y2 = min(y_coords), max(y_coords)
    
    print(f"Exact Orange Square Bounding Box: ({x1}, {y1}) to ({x2}, {y2}), size: {x2-x1+1}x{y2-y1+1}")
    
    # Save the crop
    square_crop = img.crop((x1, y1, x2 + 1, y2 + 1))
    square_crop.save('/Users/navjotkumarsingh/Desktop/VedaAI/scratch/figma_logo_square.png')
    print("Saved exact square crop to scratch/figma_logo_square.png")
    
    # Let's inspect the text next to it
    # We scan for black/dark-gray text pixels next to the square
    # Text is dark gray: R < 100, G < 100, B < 100
    text_pixels = []
    for x in range(x2 + 2, x2 + 300):
        for y in range(y1 - 10, y2 + 10):
            r, g, b = img.getpixel((x, y))[:3]
            if r < 100 and g < 100 and b < 100:
                text_pixels.append((x, y))
                
    if text_pixels:
        tx_coords = [p[0] for p in text_pixels]
        ty_coords = [p[1] for p in text_pixels]
        tx1, tx2 = min(tx_coords), max(tx_coords)
        ty1, ty2 = min(ty_coords), max(ty_coords)
        print(f"Exact Text Bounding Box: ({tx1}, {ty1}) to ({tx2}, {ty2}), size: {tx2-tx1+1}x{ty2-ty1+1}")
        print(f"Spacing between square icon and text: {tx1 - x2 - 1} pixels")
        
        # Let's print text color
        print(f"Text color (sampled): {img.getpixel((tx1+10, ty1+10))[:3]}")
        
        # Middle alignment diff:
        logo_mid = (y1 + y2) / 2.0
        text_mid = (ty1 + ty2) / 2.0
        print(f"Logo middle: {logo_mid}, Text middle: {text_mid}, Diff: {text_mid - logo_mid} pixels")
else:
    print("Orange square not found!")
