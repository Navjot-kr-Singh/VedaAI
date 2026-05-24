from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)

# Print a grid of R values in the bell region x: 805 to 845, y: 15 to 45
print("R values in the bell region (x=805..845, y=15..45):")
for y in range(15, 46):
    row_strs = []
    for x in range(805, 846):
        r, g, b = img.getpixel((x, y))[:3]
        # map to a simple character for quick visualization:
        # '.' for navbar bg (250), 'W' for white (>254), 'B' for border (220-244), 'D' for dark bell icon (<150)
        if r > 254:
            row_strs.append('W')
        elif r == 250:
            row_strs.append('.')
        elif 220 <= r <= 244:
            row_strs.append('B')
        elif r < 150:
            row_strs.append('D')
        else:
            row_strs.append(f"{r//10}")
    print(f"y={y:02d}: " + "".join(row_strs))
