from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)
w, h = img.size

# Scan the left edge columns: x from 6 to 30
print("Left edge columns vertical ranges of navbar bg (>= 245):")
for x in range(6, 31):
    ys = []
    for y in range(h):
        r, g, b = img.getpixel((x, y))[:3]
        if r >= 245 and g >= 245 and b >= 245:
            ys.append(y)
    if ys:
        print(f"x={x:02d}: y={min(ys)} to {max(ys)} (height: {max(ys) - min(ys) + 1})")
    else:
        print(f"x={x:02d}: none")
