from PIL import Image

path = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma/Screenshot 2026-05-23 at 12.01.28 AM.png'
img = Image.open(path)
w, h = img.size

# We scan the top-left area (x: 50 to 300, y: 50 to 300) to find the orange-red logo icon.
logo_pixels = []
for x in range(50, 300):
    for y in range(50, 300):
        r, g, b = img.getpixel((x, y))[:3]
        if (r > 80 and g < 160) and not (r > 240 and g > 240 and b > 240):
            logo_pixels.append((x, y))

if logo_pixels:
    x_coords = [p[0] for p in logo_pixels]
    y_coords = [p[1] for p in logo_pixels]
    lx1, lx2 = min(x_coords), max(x_coords)
    ly1, ly2 = min(y_coords), max(y_coords)
    lw = lx2 - lx1 + 1
    lh = ly2 - ly1 + 1
    print(f"Logo Icon Bounding Box: ({lx1}, {ly1}) to ({lx2}, {ly2}), size: {lw}x{lh}")
    
    # Crop the exact logo icon
    logo_icon = img.crop((lx1, ly1, lx2 + 1, ly2 + 1))
    
    # Save it to see
    logo_icon.save('/Users/navjotkumarsingh/Desktop/VedaAI/scratch/figma_logo_icon.png')
    print("Saved logo icon to scratch/figma_logo_icon.png")
    
    # Sample gradient colors along the diagonal (avoiding the white V)
    print("\nDiagonal gradient colors:")
    for i in range(11):
        frac = i / 10.0
        cx = int(frac * (lw - 1))
        cy = int(frac * (lh - 1))
        r, g, b = logo_icon.getpixel((cx, cy))[:3]
        if r > 230 and g > 230 and b > 230:
            bg_r, bg_g, bg_b = logo_icon.getpixel((6, cy))[:3]
            print(f"  {frac:.1f}: {bg_r, bg_g, bg_b} (sampled from left edge)")
        else:
            print(f"  {frac:.1f}: {r, g, b}")
            
    # Search for the text VedaAI next to the logo
    text_start_x = lx2 + 1
    text_x1 = -1
    for x in range(text_start_x, text_start_x + 150):
        for y in range(ly1, ly1 + lh):
            r, g, b = img.getpixel((x, y))[:3]
            # text is dark gray
            if r < 100 and g < 100 and b < 100:
                text_x1 = x
                break
        if text_x1 != -1:
            break
            
    # Find text bounding box to get height and spacing
    text_pixels = []
    for x in range(text_x1, text_x1 + 300):
        for y in range(ly1 - 20, ly2 + 20):
            r, g, b = img.getpixel((x, y))[:3]
            if r < 100 and g < 100 and b < 100:
                text_pixels.append((x, y))
                
    tx_coords = [p[0] for p in text_pixels]
    ty_coords = [p[1] for p in text_pixels]
    tx1, tx2 = min(tx_coords), max(tx_coords)
    ty1, ty2 = min(ty_coords), max(ty_coords)
    
    tw = tx2 - tx1 + 1
    th = ty2 - ty1 + 1
    print(f"\nText Bounding Box: ({tx1}, {ty1}) to ({tx2}, {ty2}), size: {tw}x{th}")
    print(f"Logo Icon to Text spacing: {tx1 - lx2} pixels")
    print(f"Text color (sampled): {img.getpixel((tx1+5, ty1+5))[:3]}")
    
    # Let's check vertical alignment of text relative to logo:
    # Logo height is from ly1 to ly2. Middle of logo is: (ly1 + ly2) / 2
    # Text height is from ty1 to ty2. Middle of text is: (ty1 + ty2) / 2
    logo_mid = (ly1 + ly2) / 2.0
    text_mid = (ty1 + ty2) / 2.0
    print(f"\nLogo middle: {logo_mid}, Text middle: {text_mid}, Diff: {text_mid - logo_mid} pixels")
else:
    print("Logo not found in the first screenshot!")
