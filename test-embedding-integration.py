#!/usr/bin/env python3
"""
Integration test for the embedding service interface
Tests the Python interface that will be called from Node.js
"""

import json
import subprocess
import sys
from pathlib import Path

def test_embedding_interface():
    """Test the embedding service interface"""
    print("🧪 Testing Embedding Service Interface")
    print("=" * 50)
    
    interface_script = Path("embedding_service_interface.py")
    if not interface_script.exists():
        print("❌ Interface script not found")
        return False
    
    # Test 1: Get model info
    print("\n1. Testing model info...")
    try:
        result = subprocess.run([
            sys.executable, str(interface_script), 
            "get_model_info", "{}"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if response.get('success'):
                print(f"✓ Model: {response.get('model_name')}")
                print(f"✓ Dimensions: {response.get('embedding_dimension')}")
                print(f"✓ Loaded: {response.get('is_loaded')}")
            else:
                print(f"❌ Model info failed: {response.get('error')}")
                return False
        else:
            print(f"❌ Process failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test 2: Generate ingredient embedding
    print("\n2. Testing ingredient embedding...")
    try:
        result = subprocess.run([
            sys.executable, str(interface_script),
            "generate_ingredient_embedding", 
            json.dumps({"text": "wheat flour, sugar, eggs"})
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if response.get('success'):
                embedding = response.get('embedding')
                print(f"✓ Generated embedding with {len(embedding)} dimensions")
                print(f"✓ First few values: {embedding[:5]}")
            else:
                print(f"❌ Embedding generation failed: {response.get('error')}")
                return False
        else:
            print(f"❌ Process failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test 3: Generate product name embedding
    print("\n3. Testing product name embedding...")
    try:
        result = subprocess.run([
            sys.executable, str(interface_script),
            "generate_product_name_embedding", 
            json.dumps({"text": "Chocolate Chip Cookies"})
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if response.get('success'):
                embedding = response.get('embedding')
                print(f"✓ Generated embedding with {len(embedding)} dimensions")
            else:
                print(f"❌ Product name embedding failed: {response.get('error')}")
                return False
        else:
            print(f"❌ Process failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test 4: Generate allergen embedding
    print("\n4. Testing allergen embedding...")
    try:
        result = subprocess.run([
            sys.executable, str(interface_script),
            "generate_allergen_embedding", 
            json.dumps({"text": "wheat, eggs, milk"})
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if response.get('success'):
                embedding = response.get('embedding')
                print(f"✓ Generated embedding with {len(embedding)} dimensions")
            else:
                print(f"❌ Allergen embedding failed: {response.get('error')}")
                return False
        else:
            print(f"❌ Process failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test 5: Batch processing
    print("\n5. Testing batch processing...")
    try:
        texts = [
            "organic almonds, sea salt",
            "milk chocolate, cocoa butter",
            "gluten-free oats, honey"
        ]
        
        result = subprocess.run([
            sys.executable, str(interface_script),
            "generate_embeddings_batch", 
            json.dumps({"texts": texts})
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if response.get('success'):
                embeddings = response.get('embeddings')
                print(f"✓ Generated {len(embeddings)} embeddings")
                print(f"✓ Each embedding has {len(embeddings[0])} dimensions")
            else:
                print(f"❌ Batch processing failed: {response.get('error')}")
                return False
        else:
            print(f"❌ Process failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    print("\n✅ All tests passed!")
    return True

def test_error_handling():
    """Test error handling"""
    print("\n🛡️ Testing Error Handling")
    print("=" * 30)
    
    interface_script = Path("embedding_service_interface.py")
    
    # Test invalid command
    print("\n1. Testing invalid command...")
    try:
        result = subprocess.run([
            sys.executable, str(interface_script),
            "invalid_command", "{}"
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if not response.get('success') and 'Unknown command' in response.get('error', ''):
                print("✓ Invalid command handled correctly")
            else:
                print("❌ Invalid command not handled properly")
                return False
        else:
            print(f"❌ Process failed unexpectedly: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test empty text
    print("\n2. Testing empty text...")
    try:
        result = subprocess.run([
            sys.executable, str(interface_script),
            "generate_ingredient_embedding", 
            json.dumps({"text": ""})
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if not response.get('success') and 'required' in response.get('error', '').lower():
                print("✓ Empty text handled correctly")
            else:
                print("❌ Empty text not handled properly")
                return False
        else:
            print(f"❌ Process failed unexpectedly: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    print("\n✅ Error handling tests passed!")
    return True

if __name__ == "__main__":
    print("🚀 Running Embedding Service Integration Tests")
    print("=" * 60)
    
    success = True
    
    try:
        success &= test_embedding_interface()
        success &= test_error_handling()
        
        if success:
            print("\n🎉 All integration tests passed!")
            print("✅ Embedding service interface is ready for Node.js integration")
        else:
            print("\n❌ Some tests failed")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)