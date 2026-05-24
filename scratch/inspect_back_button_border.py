from PIL import Image
import math

image_path = '/Users/navjotkumarsingh/.gemini/antigravity-ide/brain/55cfd83e-6dc0-4cac-90b2-0d7f169af0f9/media__1779635102399.png'
img = Image.open(image_path)

# Let's inspect a box around the back button: x: 26 to 65, y: 14 to 53
# We'll print the RGB values at the top, bottom, left, and right outer edges of the circle.
center_x = (28 + 63) / 2.0  # 45.5
center_y = (16 + 51) / 2.0  # 33.5
radius = 18.0

print(f"Back button estimated center: ({center_x}, {center_y}), radius: {radius}")

# Let's sample along the circle boundary (r = 18)
print("Sampling colors along the border circle:")
for angle_deg in range(0, 360, 45):
    angle_rad = math.radians(angle_deg)
    # Check pixels at r = 18 (border) and r = 19 (just outside)
    x18 = int(center_x + 18.0 * math.cos(angle_rad))
    y18 = int(center_y + 18.0 * math.sin(angle_rad))
    x19 = int(center_x + 19.0 * math.cos(angle_rad))
    y19 = int(center_y + 19.0 * math.sin(angle_rad))
    
    print(f"  Angle {angle_deg}°: r=18: {img.getpixel((x18, y18))[:3]} | r=19: {img.getpixel((x19, y19))[:3]}")

# Let's find if there is a shadow under the navbar container.
# Let's print column x=500, y=0 to 12
print("\nVertical slice at x=500, top edge of image:")
for y in range(0, 15):
    print(f"y={y}: {img.getpixel((500, y))[:3]}")

print("\nVertical slice at x=500, bottom edge of image:")
for y in range(50, 68):
    print(f"y={y}: {img.getpixel((500, y))[:3]}")
