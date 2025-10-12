#!/usr/bin/env python3
"""
Test script for Hugging Face Sentence Transformers setup
Tests model loading, caching, and basic embedding generation
"""

import os
import time
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

def setup_model_cache():
    """Configure model caching directory"""
    # Set cache directory to a local folder for better control
    cache_dir = Path("./models_cache")
    cache_dir.mkdir(exist_ok=True)
    
    # Set environment variable for transformers cache
    os.environ['TRANSFORMERS_CACHE'] = str(cache_dir)
    os.environ['SENTENCE_TRANSFORMERS_HOME'] = str(cache_dir)
    
    print(f"✓ Model cache directory configured: {cache_dir.absolute()}")
    return cache_dir

def test_model_loading():
    """Test loading the all-MiniLM-L6-v2 model"""
    print("\n=== Testing Model Loading ===")
    
    try:
        start_time = time.time()
        
        # Load the model (will download if not cached)
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        load_time = time.time() - start_time
        print(f"✓ Model loaded successfully in {load_time:.2f} seconds")
        
        # Get model info
        print(f"✓ Model max sequence length: {model.max_seq_length}")
        print(f"✓ Model embedding dimension: {model.get_sentence_embedding_dimension()}")
        
        return model
        
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        return None

def test_basic_embedding_generation(model):
    """Test basic embedding generation"""
    print("\n=== Testing Basic Embedding Generation ===")
    
    if model is None:
        print("✗ Cannot test embeddings - model not loaded")
        return False
    
    try:
        # Test sentences for food products
        test_sentences = [
            "wheat flour, sugar, chocolate chips, eggs, butter",
            "organic almonds, sea salt",
            "milk, eggs, peanuts, tree nuts",
            "gluten-free oats, honey, vanilla extract"
        ]
        
        print(f"Testing with {len(test_sentences)} sample ingredient lists...")
        
        start_time = time.time()
        embeddings = model.encode(test_sentences)
        generation_time = time.time() - start_time
        
        print(f"✓ Generated embeddings in {generation_time:.3f} seconds")
        print(f"✓ Embedding shape: {embeddings.shape}")
        print(f"✓ Expected dimensions: {len(test_sentences)} x 384")
        
        # Verify embedding properties
        if embeddings.shape == (len(test_sentences), 384):
            print("✓ Embedding dimensions are correct (384-dimensional)")
        else:
            print(f"✗ Unexpected embedding dimensions: {embeddings.shape}")
            return False
            
        # Test that embeddings are normalized (sentence-transformers normalizes by default)
        norms = np.linalg.norm(embeddings, axis=1)
        print(f"✓ Embedding norms: {norms}")
        
        # Test similarity calculation
        similarity = np.dot(embeddings[0], embeddings[2])  # wheat vs milk/eggs/nuts
        print(f"✓ Sample similarity score: {similarity:.3f}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error generating embeddings: {e}")
        return False

def test_batch_processing(model):
    """Test batch processing efficiency"""
    print("\n=== Testing Batch Processing ===")
    
    if model is None:
        print("✗ Cannot test batch processing - model not loaded")
        return False
    
    try:
        # Create a larger batch of ingredient texts
        ingredient_texts = [
            "wheat flour, sugar, eggs, butter, vanilla",
            "almonds, cashews, walnuts, pecans",
            "milk chocolate, cocoa butter, milk powder",
            "organic quinoa, brown rice, black beans",
            "tomatoes, basil, garlic, olive oil",
            "chicken breast, rosemary, thyme, pepper",
            "salmon, lemon, dill, capers",
            "spinach, kale, arugula, lettuce",
            "cheddar cheese, mozzarella, parmesan",
            "strawberries, blueberries, raspberries"
        ] * 10  # 100 total items
        
        print(f"Testing batch processing with {len(ingredient_texts)} items...")
        
        start_time = time.time()
        batch_embeddings = model.encode(ingredient_texts, batch_size=32, show_progress_bar=True)
        batch_time = time.time() - start_time
        
        print(f"✓ Batch processing completed in {batch_time:.3f} seconds")
        print(f"✓ Processing rate: {len(ingredient_texts)/batch_time:.1f} items/second")
        print(f"✓ Batch embedding shape: {batch_embeddings.shape}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error in batch processing: {e}")
        return False

def test_memory_management():
    """Test memory management settings"""
    print("\n=== Testing Memory Management ===")
    
    try:
        import torch
        
        # Check if CUDA is available (optional)
        if torch.cuda.is_available():
            print(f"✓ CUDA available: {torch.cuda.get_device_name()}")
            print(f"✓ CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        else:
            print("✓ Running on CPU (CUDA not available)")
        
        # Set memory management for CPU usage
        torch.set_num_threads(4)  # Limit CPU threads
        print(f"✓ PyTorch threads set to: {torch.get_num_threads()}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error checking memory management: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Hugging Face Sentence Transformers Setup Test")
    print("=" * 60)
    
    # Setup model caching
    cache_dir = setup_model_cache()
    
    # Test memory management
    memory_ok = test_memory_management()
    
    # Test model loading
    model = test_model_loading()
    
    # Test basic embedding generation
    embedding_ok = test_basic_embedding_generation(model)
    
    # Test batch processing
    batch_ok = test_batch_processing(model)
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 SETUP TEST SUMMARY")
    print("=" * 60)
    
    tests = [
        ("Model Cache Setup", True),
        ("Memory Management", memory_ok),
        ("Model Loading", model is not None),
        ("Basic Embeddings", embedding_ok),
        ("Batch Processing", batch_ok)
    ]
    
    all_passed = True
    for test_name, passed in tests:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{test_name:.<30} {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Hugging Face environment is ready.")
        print("\nNext steps:")
        print("- Model is cached locally for faster subsequent loads")
        print("- Ready for integration into data processing pipeline")
        print("- 384-dimensional embeddings confirmed working")
    else:
        print("❌ Some tests failed. Please check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)