from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)
w, h = img.size

# Let's find vertical bounds of the navbar capsule at multiple x locations
for x in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]:
    ys = []
    for y in range(h):
        r, g, b = img.getpixel((x, y))[:3]
        if r > 245 and g > 245 and b > 245:
            ys.append(y)
    if ys:
        print(f"x={x}: y={min(ys)} to {max(ys)} (height: {max(ys) - min(ys) + 1})")
    else:
        print(f"x={x}: no navbar background found")
