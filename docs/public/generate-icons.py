#!/usr/bin/env python3

import os
import argparse
from PIL import Image, ImageDraw
import io

def generate_icons(logo_path, output_dir='.'):
    """
    Generate various icon sizes from a source logo file

    Args:
        logo_path (str): Path to the source logo file
        output_dir (str): Directory to save generated icons
    """
    print(f"Generating icons from {logo_path}...")

    # Make sure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Load the source image
    try:
        source_img = Image.open(logo_path)
        # Convert to RGBA to ensure transparency support
        source_img = source_img.convert("RGBA")
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    # Define icon sizes to generate
    icon_sizes = {
        'favicon-16x16.png': (16, 16),
        'favicon-32x32.png': (32, 32),
        'apple-touch-icon.png': (180, 180),
        'android-chrome-192x192.png': (192, 192),
        'android-chrome-512x512.png': (512, 512),
        'mstile-150x150.png': (150, 150),
    }

    # Generate each icon size
    for filename, size in icon_sizes.items():
        try:
            # Create a new image with transparent background
            icon = Image.new('RGBA', size, (0, 0, 0, 0))

            # Resize the source image while maintaining aspect ratio
            resized_img = resize_maintain_aspect_ratio(source_img, size)

            # Center the resized image on the transparent canvas
            position = ((size[0] - resized_img.size[0]) // 2,
                        (size[1] - resized_img.size[1]) // 2)

            icon.paste(resized_img, position, resized_img)

            # Save the icon
            output_path = os.path.join(output_dir, filename)
            icon.save(output_path)
            print(f"Generated: {output_path}")

        except Exception as e:
            print(f"Error generating {filename}: {e}")

    # Generate favicon.ico (multi-size ICO)
    try:
        ico_sizes = [(16, 16), (32, 32), (48, 48)]
        # Resize source into each size
        ico_images = [resize_maintain_aspect_ratio(source_img, sz) for sz in ico_sizes]
        ico_output_path = os.path.join(output_dir, 'favicon.ico')
        # Save the first image but embed all sizes
        ico_images[0].save(ico_output_path, format='ICO', sizes=ico_sizes)
        print(f"Generated: {ico_output_path}")
    except Exception as e:
        print(f"Error generating favicon.ico: {e}")

    # Generate OG Image (1200x630)
    try:
        # Create a background with orange gradient
        og_size = (1200, 630)
        og_image = Image.new('RGB', og_size, (249, 115, 22))  # Orange background (#f97316)

        # Create a gradient overlay
        gradient = create_gradient(og_size, (249, 115, 22), (239, 68, 68))  # Orange to red
        og_image.paste(gradient, (0, 0))

        # Resize logo to fit nicely in the OG image (30% of height)
        logo_height = int(og_size[1] * 0.3)
        logo_resized = resize_maintain_aspect_ratio(source_img, (og_size[0], logo_height))

        # Center the logo in the top half
        position = ((og_size[0] - logo_resized.size[0]) // 2,
                    (og_size[1] // 4 - logo_resized.size[1] // 2))

        og_image.paste(logo_resized, position, logo_resized)

        # Save the OG image
        og_output_path = os.path.join(output_dir, 'og-image.jpg')
        og_image.save(og_output_path, quality=90)
        print(f"Generated: {og_output_path}")

    except Exception as e:
        print(f"Error generating OG image: {e}")

    # Generate Safari SVG icon - this is simplified and may need manual refinement
    try:
        # Create a simple SVG with the logo silhouette
        # This is a very simplified approach - the result may need manual editing
        svg_output_path = os.path.join(output_dir, 'safari-pinned-tab.svg')
        create_simple_svg_silhouette(source_img, svg_output_path)
        print(f"Generated simplified SVG silhouette: {svg_output_path}")
        print("Note: The SVG may need manual refinement for better results.")

    except Exception as e:
        print(f"Error generating Safari SVG: {e}")

    print("\nIcon generation complete!")
    print("\nNote: favicon.ico is not included in this script as it requires multi-size ICO format.")
    print("Consider using an online service like https://realfavicongenerator.net/ for favicon.ico")

def resize_maintain_aspect_ratio(image, target_size):
    """
    Resize image while maintaining aspect ratio, to fit within target_size
    """
    original_width, original_height = image.size
    target_width, target_height = target_size

    # Calculate scaling factor to fit within target size
    width_ratio = target_width / original_width
    height_ratio = target_height / original_height
    scale_factor = min(width_ratio, height_ratio)

    # Calculate new dimensions
    new_width = int(original_width * scale_factor)
    new_height = int(original_height * scale_factor)

    # Resize the image
    return image.resize((new_width, new_height), Image.LANCZOS)

def create_gradient(size, color1, color2):
    """
    Create a horizontal gradient image from color1 to color2
    """
    width, height = size
    gradient = Image.new('RGB', size, color1)
    draw = ImageDraw.Draw(gradient)

    for x in range(width):
        # Calculate the ratio between color1 and color2 based on position
        ratio = x / width
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)

        # Draw a line with the calculated color
        draw.line([(x, 0), (x, height)], fill=(r, g, b))

    return gradient

def create_simple_svg_silhouette(image, output_path):
    """
    Create a simple SVG silhouette from the image
    This is a very basic approach and may need manual refinement
    """
    try:
        # Resize to smaller working size and convert to black and white
        work_size = (64, 64)
        img_small = resize_maintain_aspect_ratio(image, work_size)
        img_bw = img_small.convert("L")  # Convert to grayscale

        # Debug image dimensions
        print(f"Debug: SVG working image size: {img_small.size}")

        # Threshold to create binary image (adjust threshold as needed)
        threshold = 200
        img_binary = img_bw.point(lambda p: 255 if p > threshold else 0)

        # Get actual dimensions after processing
        width, height = img_binary.size

        # Define SVG header with viewBox matching our actual image size
        svg_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}px" height="{height}px" viewBox="0 0 {width} {height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <g fill="#000000">
"""

        # Very simple approach: add a rectangle for each black pixel
        # This is not efficient but works for a basic silhouette
        had_error = False
        try:
            for y in range(height):
                for x in range(width):
                    pixel = img_binary.getpixel((x, y))
                    if pixel == 0:  # Black pixel in our binary image
                        svg_content += f'    <rect x="{x}" y="{y}" width="1" height="1" />\n'
        except IndexError as e:
            had_error = True
            print(f"Warning: Index error while processing SVG pixels at position ({x},{y}). Using simplified approach.")
            # If we hit an index error, fall back to a simple SVG with a rectangle
            svg_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}px" height="{height}px" viewBox="0 0 {width} {height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="{width}" height="{height}" fill="#000000" />
</svg>"""

        # Close SVG tags if we're using the detailed approach
        if not had_error:
            svg_content += "  </g>\n</svg>"

        # Write to file
        with open(output_path, 'w') as f:
            f.write(svg_content)

        return True

    except Exception as e:
        print(f"Debug: Error in SVG generation: {e}")

        # Create a fallback simple SVG as a placeholder
        try:
            fallback_svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg width="64px" height="64px" viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="12" width="40" height="40" fill="#000000" />
</svg>"""
            with open(output_path, 'w') as f:
                f.write(fallback_svg)
            print("Created fallback SVG silhouette")
            return True
        except Exception as fallback_error:
            print(f"Could not create fallback SVG: {fallback_error}")
            return False

if __name__ == "__main__":
    # Set up command line arguments
    parser = argparse.ArgumentParser(description='Generate website icon files from a source image')
    parser.add_argument('logo_path', help='Path to the source logo file')
    parser.add_argument('-o', '--output-dir', default='.', help='Directory to save generated icons (default: current directory)')

    args = parser.parse_args()

    # Call the icon generation function with provided parameters
    generate_icons(args.logo_path, args.output_dir)
