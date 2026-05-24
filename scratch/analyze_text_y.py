from PIL import Image

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)

# Scan "Assignment" text area: x=99 to 177, y=10 to 55
assign_ys = []
for y in range(10, 55):
    for x in range(99, 178):
        r, g, b = img.getpixel((x, y))[:3]
        if r < 200 and g < 200 and b < 200: # Text is gray
            assign_ys.append(y)

if assign_ys:
    print(f"Assignment text vertical range: y={min(assign_ys)} to {max(assign_ys)} (height: {max(assign_ys) - min(assign_ys) + 1}px)")
else:
    print("Assignment text vertical range not found")

# Scan "John Doe" text area: x=907 to 965, y=10 to 55
john_ys = []
for y in range(10, 55):
    for x in range(907, 966):
        r, g, b = img.getpixel((x, y))[:3]
        if r < 120 and g < 120 and b < 120: # Text is dark
            john_ys.append(y)

if john_ys:
    print(f"John Doe text vertical range: y={min(john_ys)} to {max(john_ys)} (height: {max(john_ys) - min(john_ys) + 1}px)")
else:
    print("John Doe text vertical range not found")

# Scan Chevron down area: x=972 to 985, y=10 to 55
chev_ys = []
for y in range(10, 55):
    for x in range(972, 986):
        r, g, b = img.getpixel((x, y))[:3]
        if r < 180 and g < 180 and b < 180: # Chevron is gray
            chev_ys.append(y)

if chev_ys:
    print(f"Chevron vertical range: y={min(chev_ys)} to {max(chev_ys)} (height: {max(chev_ys) - min(chev_ys) + 1}px)")
else:
    print("Chevron vertical range not found")
