from PIL import Image
import os

def pad_image(input_path, output_path, padding_factor=0.3):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # We want the content to be smaller relative to the full icon
        # So we can create a larger canvas and paste the image in the center
        # Or resize the image down and paste it on a canvas of the same size
        
        # Method: Resize content down
        target_size = (int(width * (1 - padding_factor)), int(height * (1 - padding_factor)))
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
        
        new_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        
        # Calculate position to center
        x = (width - target_size[0]) // 2
        y = (height - target_size[1]) // 2
        
        new_img.paste(img_resized, (x, y), img_resized)
        
        new_img.save(output_path)
        print(f"Created padded image at {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    input_file = "assets/logo.png"
    output_file = "assets/logo_padded.png"
    
    # Check if input exists
    if not os.path.exists(input_file):
        print(f"Input file not found: {input_file}")
    else:
        # Increase padding factor to make logo smaller (0.4 means 40% padding, logo is 60% of size)
        pad_image(input_file, output_file, padding_factor=0.35)
