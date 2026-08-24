import os
import zipfile
import shutil

zip_path = r"C:\nusic_gen\assets\sounds\piano\piano-mp3.zip"
extract_dir = r"C:\nusic_gen\assets\sounds\piano\extracted"
dest_dir = r"C:\nusic_gen\assets\sounds\piano"

if not os.path.exists(extract_dir):
    os.makedirs(extract_dir)

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_dir)

# The repo structure is usually piano-mp3-master/piano-mp3
source_folder = os.path.join(extract_dir, "piano-mp3-master", "piano-mp3")
if not os.path.exists(source_folder):
    # Try just piano-mp3-master
    source_folder = os.path.join(extract_dir, "piano-mp3-master")

print(f"Source folder: {source_folder}")
files = os.listdir(source_folder)

# Map sharps and flats: the repo uses 'b' for flats (e.g., Bb4.mp3).
# We want to use our standard ID format: 'C4', 'Cs4' (for C#4).
# A Bb4 is an A#4.
note_mapping = {
    'Db': 'Cs',
    'Eb': 'Ds',
    'Gb': 'Fs',
    'Ab': 'Gs',
    'Bb': 'As'
}

js_map_lines = []

for file in files:
    if file.endswith('.mp3'):
        base_name = file.replace('.mp3', '')
        
        # Convert flats to sharps for standard ID mapping
        mapped_name = base_name
        for flat, sharp in note_mapping.items():
            if flat in base_name:
                mapped_name = base_name.replace(flat, sharp)
                break
        
        # Example: 'C4' or 'Cs4'
        note_id = mapped_name.replace('s', '#')
        
        # Copy to destination with our standardized name
        new_filename = f"{mapped_name}.mp3"
        shutil.copy2(os.path.join(source_folder, file), os.path.join(dest_dir, new_filename))
        
        # Add to JS map
        js_map_lines.append(f"  '{note_id}': require('../../../assets/sounds/piano/{new_filename}'),")

# Write the SoundMap.js file
soundmap_path = r"C:\nusic_gen\src\screens\features\SoundMap.js"
with open(soundmap_path, 'w') as f:
    f.write("export const SOUND_MAP = {\n")
    for line in sorted(js_map_lines):
        f.write(line + "\n")
    f.write("};\n")

print(f"Successfully generated {len(js_map_lines)} keys and saved to SoundMap.js")

# Clean up
try:
    shutil.rmtree(extract_dir)
    os.remove(zip_path)
except:
    pass
