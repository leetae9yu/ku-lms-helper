#!/usr/bin/env python3
"""Generate Chrome extension icons for KU LMS Helper."""

from PIL import Image, ImageDraw, ImageFont
import os

# KU Red color
KU_RED = (139, 0, 41)  # #8B0029
WHITE = (255, 255, 255)
LIGHT_GRAY = (245, 245, 245)

def create_icon(size):
    """Create a single icon with given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background with KU red
    radius = size // 8
    margin = 2
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=KU_RED
    )
    
    # Draw "KU" text in white
    # Calculate font size based on icon size
    font_size = int(size * 0.55)
    
    # Try to use a bold font, fall back to default
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()
    
    text = "KU"
    
    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    # Draw text with slight shadow for depth
    shadow_offset = max(1, size // 64)
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, 100))
    draw.text((x, y), text, font=font, fill=WHITE)
    
    return img

def main():
    """Generate all required icon sizes."""
    sizes = [16, 32, 48, 128]
    output_dir = "/root/projects/ku-lms-helper/assets/icons"
    
    os.makedirs(output_dir, exist_ok=True)
    
    for size in sizes:
        icon = create_icon(size)
        output_path = os.path.join(output_dir, f"icon{size}.png")
        icon.save(output_path, "PNG")
        print(f"Created: {output_path}")
    
    print(f"\nAll icons created successfully in {output_dir}")

if __name__ == "__main__":
    main()
