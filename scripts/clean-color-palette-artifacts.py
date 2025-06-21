#!/usr/bin/env python3
"""Clean WordPress color palette artifacts from content files."""

import os
import re
import glob

def clean_color_palette_artifacts(content):
    """Remove all variations of WordPress color palette configuration data."""
    patterns = [
        # Escaped underscores with complete blocks
        r'\\_\\_CONFIG_colors_palette\\_\\_.*?\\_\\_CONFIG_colors_palette\\_\\_',
        # Escaped underscores with incomplete end tags
        r'\\_\\_CONFIG_colors_palette\\_\\_[^_]*(?=\s|$|\[)',
        # Regular underscores (in case any remain)
        r'__CONFIG_colors_palette__.*?__CONFIG_colors_palette__',
        r'__CONFIG_colors_palette__[^_]*(?=\s|$|\[)',
    ]
    
    cleaned = content
    total_removed = 0
    
    for pattern in patterns:
        matches = re.findall(pattern, cleaned, re.DOTALL)
        if matches:
            total_removed += len(matches)
            cleaned = re.sub(pattern, ' ', cleaned, flags=re.DOTALL)
    
    # Clean up extra whitespace
    cleaned = re.sub(r'\n\s*\n\s*\n', '\n\n', cleaned)
    cleaned = re.sub(r'[ \t]+\n', '\n', cleaned)
    cleaned = re.sub(r'\n[ \t]+', '\n', cleaned)
    cleaned = re.sub(r'  +', ' ', cleaned)  # Multiple spaces to single space
    
    return cleaned, total_removed

def main():
    """Process all markdown files in content directories."""
    content_dirs = ['src/content/blog', 'src/content/wpPages']
    total_files = 0
    cleaned_files = 0
    total_artifacts = 0
    
    print("🧹 Cleaning Color Palette Artifacts from Content Files\n")
    
    for content_dir in content_dirs:
        if not os.path.exists(content_dir):
            continue
            
        print(f"📁 Processing {content_dir}...")
        
        # Find all markdown files recursively
        pattern = os.path.join(content_dir, '**', '*.md')
        files = glob.glob(pattern, recursive=True)
        
        for file_path in files:
            total_files += 1
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                cleaned_content, artifacts_removed = clean_color_palette_artifacts(content)
                
                if artifacts_removed > 0:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(cleaned_content)
                    
                    cleaned_files += 1
                    total_artifacts += artifacts_removed
                    
                    rel_path = os.path.relpath(file_path)
                    print(f"✅ {rel_path}: removed {artifacts_removed} artifacts")
                    
            except Exception as e:
                print(f"❌ Error processing {file_path}: {e}")
    
    print(f'\n📊 Cleanup Summary:')
    print(f'   📄 Total files processed: {total_files}')
    print(f'   ✅ Files cleaned: {cleaned_files}')
    print(f'   🗑️  Total artifacts removed: {total_artifacts}')
    
    if cleaned_files > 0:
        print('\n🎉 Color palette artifacts successfully cleaned!')
    else:
        print('\n✨ No color palette artifacts found - content is clean!')

if __name__ == '__main__':
    main() 