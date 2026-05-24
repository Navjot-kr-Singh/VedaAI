import os
from PIL import Image

figma_dir = '/Users/navjotkumarsingh/Desktop/VedaAI/Figma'
files = [f for f in os.listdir(figma_dir) if f.endswith('.png')]

def find_logo_in_image(path):
    img = Image.open(path)
    width, height = img.size
    
    # We look for a bounding box of a rounded square of size roughly 30x30 to 200x200
    # that has high orange/red content at top-left and dark burgundy at bottom-right,
    # and contains a solid white shape in the middle.
    # Let's search for pixels that are very close to the logo background colors.
    # Top-left of logo: orange (e.g. R > 200, 80 < G < 140, B < 80)
    # Bottom-right of logo: burgundy (e.g. 100 < R < 160, G < 40, B < 40)
    # And there must be a white area (R > 250, G > 250, B > 250) inside.
    
    # To be fast, let's sample every 4th pixel
    for y in range(0, height, 4):
        for x in range(0, width, 4):
            r, g, b = img.getpixel((x, y))[:3]
            # Check for top-left orange color
            if r > 210 and 90 < g < 130 and b < 70:
                # We found a potential top-left orange pixel!
                # Let's check if there is a burgundy pixel nearby (e.g. within 150 pixels down and right)
                found_burgundy = False
                bx_match, by_match = 0, 0
                for dy in range(20, 150, 4):
                    for dx in range(20, 150, 4):
                        nx, ny = x + dx, y + dy
                        if nx < width and ny < height:
                            nr, ng, nb = img.getpixel((nx, ny))[:3]
                            if 90 < nr < 150 and ng < 35 and nb < 35:
                                found_burgundy = True
                                bx_match, by_match = nx, ny
                                break
                    if found_burgundy:
                        break
                
                if found_burgundy:
                    # Let's check if there are white pixels in the bounding box between (x, y) and (bx_match, by_match)
                    found_white = False
                    for wy in range(y, by_match, 2):
                        for wx in range(x, bx_match, 2):
                            wr, wg, wb = img.getpixel((wx, wy))[:3]
                            if wr > 250 and wg > 250 and wb > 250:
                                found_white = True
                                break
                        if found_white:
                            break
                    
                    if found_white:
                        # We found the logo! Let's print the bounding box and return
                        print(f"Found logo in {os.path.basename(path)} at top-left: ({x}, {y}), bottom-right: ({bx_match}, {by_match})")
                        # Let's print some key colors in this bounding box:
                        print("Colors:")
                        print(f"  Top-left corner ({x+5}, {y+5}): {img.getpixel((x+5, y+5))[:3]}")
                        print(f"  Bottom-right corner ({bx_match-5}, {by_match-5}): {img.getpixel((bx_match-5, by_match-5))[:3]}")
                        print(f"  Center ({x + (bx_match-x)//2}, {y + (by_match-y)//2}): {img.getpixel((x + (bx_match-x)//2, y + (by_match-y)//2))[:3]}")
                        return True
    return False

for f in files:
    path = os.path.join(figma_dir, f)
    if find_logo_in_image(path):
        break
