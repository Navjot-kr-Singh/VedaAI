from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779644846918.png'
img = Image.open(image_path)
w, h = img.size

# Let's find the input background color.
# In the image, the Due Date input is around y=680 (let's scan from y=660 to y=720, x=300 to x=600)
# We search for gray-ish backgrounds of inputs.
input_colors = []
for y in range(660, 720):
    for x in range(300, 600):
        r, g, b = img.getpixel((x, y))[:3]
        # Look for typical light gray input bg: e.g. R between 240 and 246
        if 240 <= r <= 246 and 240 <= g <= 246 and 240 <= b <= 246:
            input_colors.append((r, g, b))

if input_colors:
    # Print the most common color
    from collections import Counter
    c = Counter(input_colors)
    print("Most common input background colors:", c.most_common(5))
else:
    print("No input background colors found in scan range")
