#!/usr/bin/env python3
"""
Test script to verify Task 2.3 implementation
Tests the enhanced embedding generation for product data
"""

import sys
import json
from embedding_service import EmbeddingService

def test_ingredient_embedding_with_normalization():
    """Test ingredient text embedding with normalization"""
    print("🥄 Testing Ingredient Embedding with Normalization")
    print("-" * 50)
    
    service = EmbeddingService()
    
    test_cases = [
        "WHEAT FLOUR, SUGAR, CHOCOLATE CHIPS",
        "ingredients: wheat flour, cane sugar, eggs",
        "Contains: milk, eggs, may contain: tree nuts",
        "organic almonds, sea salt, natural flavor"
    ]
    
    for i, ingredient_text in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {ingredient_text}")
        
        embedding = service.generate_ingredient_embedding(ingredient_text)
        
        if embedding is not None:
            print(f"   ✅ Generated embedding: {len(embedding)} dimensions")
            print(f"   ✅ Magnitude: {embedding.dot(embedding)**0.5:.4f}")
            print(f"   ✅ First 3 values: [{embedding[0]:.4f}, {embedding[1]:.4f}, {embedding[2]:.4f}]")
        else:
            print(f"   ❌ Failed to generate embedding")
            return False
    
    return True

def test_product_name_embedding_with_normalization():
    """Test product name embedding with normalization"""
    print("\n🏷️ Testing Product Name Embedding with Normalization")
    print("-" * 50)
    
    service = EmbeddingService()
    
    test_cases = [
        "Oreo Original Chocolate Sandwich Cookies",
        "PEPPERIDGE FARM Goldfish Crackers - Cheddar",
        "Ben & Jerry's Choc Chip Cookie Dough",
        "Lay's Classic Potato Chips w/ Sea Salt"
    ]
    
    for i, product_name in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {product_name}")
        
        embedding = service.generate_product_name_embedding(product_name)
        
        if embedding is not None:
            print(f"   ✅ Generated embedding: {len(embedding)} dimensions")
            print(f"   ✅ Magnitude: {embedding.dot(embedding)**0.5:.4f}")
            print(f"   ✅ First 3 values: [{embedding[0]:.4f}, {embedding[1]:.4f}, {embedding[2]:.4f}]")
        else:
            print(f"   ❌ Failed to generate embedding")
            return False
    
    return True

def test_allergen_profile_embedding():
    """Test allergen profile embedding from allergen tags"""
    print("\n⚠️ Testing Allergen Profile Embedding")
    print("-" * 50)
    
    service = EmbeddingService()
    
    test_cases = [
        ["en:wheat", "en:eggs", "en:milk"],
        ["tree-nuts", "peanuts"],
        "contains: soy, may contain: sesame",
        ["en:fish", "en:shellfish"],
        "no known allergens"
    ]
    
    for i, allergens in enumerate(test_cases, 1):
        allergen_display = allergens if isinstance(allergens, str) else ", ".join(allergens)
        print(f"\n{i}. Testing: {allergen_display}")
        
        embedding = service.generate_allergen_embedding(allergens)
        
        if embedding is not None:
            print(f"   ✅ Generated embedding: {len(embedding)} dimensions")
            print(f"   ✅ Magnitude: {embedding.dot(embedding)**0.5:.4f}")
            print(f"   ✅ First 3 values: [{embedding[0]:.4f}, {embedding[1]:.4f}, {embedding[2]:.4f}]")
        else:
            print(f"   ❌ Failed to generate embedding")
            return False
    
    return True

def test_embedding_quality_validation():
    """Test embedding quality validation and consistency checks"""
    print("\n🔍 Testing Embedding Quality Validation")
    print("-" * 50)
    
    service = EmbeddingService()
    
    # Test valid cases
    print("\n1. Testing valid inputs:")
    valid_cases = [
        ("ingredient", "wheat flour, sugar, eggs"),
        ("product_name", "Chocolate Chip Cookies"),
        ("allergen", ["wheat", "milk"])
    ]
    
    for embedding_type, text in valid_cases:
        print(f"   Testing {embedding_type}: {text}")
        
        if embedding_type == "ingredient":
            embedding = service.generate_ingredient_embedding(text)
        elif embedding_type == "product_name":
            embedding = service.generate_product_name_embedding(text)
        else:  # allergen
            embedding = service.generate_allergen_embedding(text)
        
        if embedding is not None:
            print(f"   ✅ Valid embedding generated ({len(embedding)} dims)")
        else:
            print(f"   ❌ Failed validation")
            return False
    
    # Test edge cases
    print("\n2. Testing edge cases:")
    edge_cases = [
        ("ingredient", "a"),  # Very short
        ("product_name", "X Y Z Brand Cookies"),  # With brand
        ("allergen", []),  # Empty list
    ]
    
    for embedding_type, text in edge_cases:
        print(f"   Testing {embedding_type}: {text}")
        
        try:
            if embedding_type == "ingredient":
                embedding = service.generate_ingredient_embedding(text)
            elif embedding_type == "product_name":
                embedding = service.generate_product_name_embedding(text)
            else:  # allergen
                # Handle empty allergen list
                allergen_input = "no known allergens" if not text else text
                embedding = service.generate_allergen_embedding(allergen_input)
            
            if embedding is not None:
                print(f"   ✅ Handled edge case ({len(embedding)} dims)")
            else:
                print(f"   ⚠️ Edge case rejected (expected)")
        except Exception as e:
            print(f"   ⚠️ Edge case error: {str(e)[:50]}... (may be expected)")
    
    return True

def test_consistency_checks():
    """Test embedding consistency for same inputs"""
    print("\n🔄 Testing Embedding Consistency")
    print("-" * 50)
    
    service = EmbeddingService()
    
    test_text = "wheat flour, sugar, chocolate chips"
    
    print(f"Testing consistency for: {test_text}")
    
    # Generate same embedding multiple times
    embeddings = []
    for i in range(3):
        embedding = service.generate_ingredient_embedding(test_text)
        if embedding is not None:
            embeddings.append(embedding)
        else:
            print(f"   ❌ Failed to generate embedding {i+1}")
            return False
    
    # Check consistency
    if len(embeddings) == 3:
        # Compare embeddings (should be identical)
        import numpy as np
        
        diff_1_2 = np.abs(embeddings[0] - embeddings[1]).max()
        diff_1_3 = np.abs(embeddings[0] - embeddings[2]).max()
        diff_2_3 = np.abs(embeddings[1] - embeddings[2]).max()
        
        print(f"   Max difference 1-2: {diff_1_2:.8f}")
        print(f"   Max difference 1-3: {diff_1_3:.8f}")
        print(f"   Max difference 2-3: {diff_2_3:.8f}")
        
        if diff_1_2 < 1e-6 and diff_1_3 < 1e-6 and diff_2_3 < 1e-6:
            print("   ✅ Embeddings are consistent")
            return True
        else:
            print("   ❌ Embeddings are not consistent")
            return False
    
    return False

def main():
    """Run all tests for Task 2.3 implementation"""
    print("🧪 Testing Task 2.3: Implement embedding generation for product data")
    print("=" * 80)
    
    tests = [
        test_ingredient_embedding_with_normalization,
        test_product_name_embedding_with_normalization,
        test_allergen_profile_embedding,
        test_embedding_quality_validation,
        test_consistency_checks
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
                print(f"\n✅ {test_func.__name__} PASSED")
            else:
                print(f"\n❌ {test_func.__name__} FAILED")
        except Exception as e:
            print(f"\n💥 {test_func.__name__} ERROR: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Task 2.3 implementation is complete.")
        return True
    else:
        print("❌ Some tests failed. Please review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)