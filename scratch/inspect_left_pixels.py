from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)
w, h = img.size

print("Left edge R values (x=0..20, y=0..30):")
for y in range(0, 31):
    row = []
    for x in range(0, 21):
        row.append(img.getpixel((x, y))[0])
    print(f"y={y:02d}: " + " ".join(f"{r:3d}" for r in row))
