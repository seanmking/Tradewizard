# Import the actual implementation from tradewizard backend
import sys
import os
import importlib.util

# Get the path to the real implementation
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
real_file_path = os.path.join(project_root, 'tradewizard', 'backend', 'services', 'website_analyzer.py')

# Load the module from the file path
try:
    spec = importlib.util.spec_from_file_location("website_analyzer", real_file_path)
    website_analyzer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(website_analyzer)

    # Import all attributes from the real module into this module's namespace
    for attr_name in dir(website_analyzer):
        if not attr_name.startswith('__'):
            globals()[attr_name] = getattr(website_analyzer, attr_name)
            
    print(f"Successfully loaded website_analyzer from {real_file_path}")
except Exception as e:
    print(f"Failed to load website_analyzer from {real_file_path}: {e}")
    # Fallback implementation
    def analyze_website(url, **kwargs):
        """Fallback implementation if the real one can't be loaded"""
        return {
            "success": False,
            "error": f"Module loading failed: {str(e)}",
            "data": {}
        } 