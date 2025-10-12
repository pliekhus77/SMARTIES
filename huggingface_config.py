#!/usr/bin/env python3
"""
Hugging Face Sentence Transformers Configuration
Centralized configuration for embedding generation in the SMARTIES project
"""

import os
from pathlib import Path
from typing import Dict, Any

class HuggingFaceConfig:
    """Configuration class for Hugging Face Sentence Transformers setup"""
    
    # Model Configuration
    MODEL_NAME = 'all-MiniLM-L6-v2'
    EMBEDDING_DIMENSION = 384
    MAX_SEQUENCE_LENGTH = 256
    
    # Performance Configuration
    DEFAULT_BATCH_SIZE = 32
    CPU_THREADS = 4
    SHOW_PROGRESS = True
    
    # Cache Configuration
    CACHE_DIR = Path("./models_cache")
    
    # Memory Management
    MEMORY_SETTINGS = {
        'torch_threads': CPU_THREADS,
        'batch_size': DEFAULT_BATCH_SIZE,
        'normalize_embeddings': True  # sentence-transformers does this by default
    }
    
    @classmethod
    def setup_environment(cls) -> None:
        """Setup environment variables for optimal performance"""
        # Create cache directory
        cls.CACHE_DIR.mkdir(exist_ok=True)
        
        # Set environment variables
        os.environ['TRANSFORMERS_CACHE'] = str(cls.CACHE_DIR)
        os.environ['SENTENCE_TRANSFORMERS_HOME'] = str(cls.CACHE_DIR)
        os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'  # Disable symlink warnings on Windows
        
        # Set PyTorch threads for CPU optimization
        import torch
        torch.set_num_threads(cls.CPU_THREADS)
    
    @classmethod
    def get_model_info(cls) -> Dict[str, Any]:
        """Get model configuration information"""
        return {
            'model_name': cls.MODEL_NAME,
            'embedding_dimension': cls.EMBEDDING_DIMENSION,
            'max_sequence_length': cls.MAX_SEQUENCE_LENGTH,
            'cache_directory': str(cls.CACHE_DIR.absolute()),
            'batch_size': cls.DEFAULT_BATCH_SIZE,
            'cpu_threads': cls.CPU_THREADS
        }
    
    @classmethod
    def get_encoding_params(cls) -> Dict[str, Any]:
        """Get default parameters for encoding operations"""
        return {
            'batch_size': cls.DEFAULT_BATCH_SIZE,
            'show_progress_bar': cls.SHOW_PROGRESS,
            'normalize_embeddings': True,
            'convert_to_numpy': True
        }

# Usage example and validation
if __name__ == "__main__":
    print("🔧 Hugging Face Configuration")
    print("=" * 40)
    
    # Setup environment
    HuggingFaceConfig.setup_environment()
    
    # Display configuration
    config = HuggingFaceConfig.get_model_info()
    for key, value in config.items():
        print(f"{key:.<25} {value}")
    
    print("\n✓ Configuration ready for use in data processing pipeline")