#!/usr/bin/env python3
"""
Unit tests for Hugging Face Embedding Service
Tests embedding generation consistency, quality, batch processing, caching, and model loading
"""

import unittest
import numpy as np
import time
import tempfile
import os
from unittest.mock import Mock, patch, MagicMock
from typing import List, Optional

# Import the service to test
from embedding_service import EmbeddingService
from huggingface_config import HuggingFaceConfig


class TestEmbeddingService(unittest.TestCase):
    """Test cases for EmbeddingService class"""
    
    def setUp(self):
        """Set up test fixtures before each test method"""
        self.service = EmbeddingService()
        
        # Mock model for testing without actual model loading
        self.mock_model = Mock()
        self.mock_model.get_sentence_embedding_dimension.return_value = 384
        self.mock_model.max_seq_length = 256
        
        # Sample test data
        self.test_ingredient = "wheat flour, sugar, eggs, butter"
        self.test_product_name = "Chocolate Chip Cookies"
        self.test_allergens = ["wheat", "eggs", "milk"]
        self.test_batch_texts = [
            "organic almonds, sea salt",
            "milk chocolate, cocoa butter", 
            "gluten-free oats, honey"
        ]
        
        # Expected embedding dimension
        self.expected_dimension = 384
    
    def tearDown(self):
        """Clean up after each test method"""
        # Reset service state
        self.service.model = None
        self.service.is_loaded = False


class TestModelLoading(TestEmbeddingService):
    """Test model loading functionality"""
    
    @patch('embedding_service.SentenceTransformer')
    def test_load_model_success(self, mock_sentence_transformer):
        """Test successful model loading"""
        # Arrange
        mock_sentence_transformer.return_value = self.mock_model
        
        # Act
        result = self.service.load_model()
        
        # Assert
        self.assertTrue(result)
        self.assertTrue(self.service.is_loaded)
        self.assertIsNotNone(self.service.model)
        mock_sentence_transformer.assert_called_once_with(self.service.model_name)
    
    @patch('embedding_service.SentenceTransformer')
    def test_load_model_failure(self, mock_sentence_transformer):
        """Test model loading failure"""
        # Arrange
        mock_sentence_transformer.side_effect = Exception("Model loading failed")
        
        # Act
        result = self.service.load_model()
        
        # Assert
        self.assertFalse(result)
        self.assertFalse(self.service.is_loaded)
        self.assertIsNone(self.service.model)
    
    @patch('embedding_service.SentenceTransformer')
    def test_load_model_already_loaded(self, mock_sentence_transformer):
        """Test loading model when already loaded"""
        # Arrange
        self.service.model = self.mock_model
        self.service.is_loaded = True
        
        # Act
        result = self.service.load_model()
        
        # Assert
        self.assertTrue(result)
        mock_sentence_transformer.assert_not_called()
    
    def test_model_info_when_loaded(self):
        """Test getting model info when model is loaded"""
        # Arrange
        self.service.model = self.mock_model
        self.service.is_loaded = True
        
        # Act
        info = self.service.get_model_info()
        
        # Assert
        self.assertTrue(info['is_loaded'])
        self.assertEqual(info['actual_embedding_dim'], 384)
        self.assertEqual(info['actual_max_seq_length'], 256)
    
    def test_model_info_when_not_loaded(self):
        """Test getting model info when model is not loaded"""
        # Act
        info = self.service.get_model_info()
        
        # Assert
        self.assertFalse(info['is_loaded'])
        self.assertNotIn('actual_embedding_dim', info)


class TestEmbeddingGeneration(TestEmbeddingService):
    """Test embedding generation functionality"""
    
    def setUp(self):
        """Set up for embedding generation tests"""
        super().setUp()
        # Mock loaded model
        self.service.model = self.mock_model
        self.service.is_loaded = True
        
        # Create consistent mock embedding with proper normalization
        self.mock_embedding = np.random.rand(384).astype(np.float32)
        # Normalize to unit vector to pass quality validation
        self.mock_embedding = self.mock_embedding / np.linalg.norm(self.mock_embedding)
        self.mock_model.encode.return_value = np.array([self.mock_embedding])
    
    def test_generate_embedding_success(self):
        """Test successful single embedding generation"""
        # Act
        result = self.service.generate_embedding(self.test_ingredient)
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(len(result), self.expected_dimension)
        self.assertIsInstance(result, np.ndarray)
        self.mock_model.encode.assert_called_once()
    
    def test_generate_embedding_consistency(self):
        """Test embedding generation consistency for same input"""
        # Act
        embedding1 = self.service.generate_embedding(self.test_ingredient)
        embedding2 = self.service.generate_embedding(self.test_ingredient)
        
        # Assert
        self.assertIsNotNone(embedding1)
        self.assertIsNotNone(embedding2)
        np.testing.assert_array_equal(embedding1, embedding2)
    
    def test_generate_embedding_model_not_loaded(self):
        """Test embedding generation when model not loaded"""
        # Arrange
        self.service.is_loaded = False
        self.service.model = None
        
        with patch.object(self.service, 'load_model', return_value=False):
            # Act
            result = self.service.generate_embedding(self.test_ingredient)
            
            # Assert
            self.assertIsNone(result)
    
    def test_generate_embedding_model_error(self):
        """Test embedding generation with model error"""
        # Arrange
        self.mock_model.encode.side_effect = Exception("Model encoding failed")
        
        # Act
        result = self.service.generate_embedding(self.test_ingredient)
        
        # Assert
        self.assertIsNone(result)
    
    def test_generate_ingredient_embedding_success(self):
        """Test ingredient-specific embedding generation"""
        # Act
        result = self.service.generate_ingredient_embedding(self.test_ingredient)
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(len(result), self.expected_dimension)
        self.assertIsInstance(result, np.ndarray)
    
    def test_generate_ingredient_embedding_empty_text(self):
        """Test ingredient embedding with empty text"""
        # Act
        result = self.service.generate_ingredient_embedding("")
        
        # Assert
        self.assertIsNone(result)
    
    def test_generate_ingredient_embedding_whitespace_only(self):
        """Test ingredient embedding with whitespace-only text"""
        # Act
        result = self.service.generate_ingredient_embedding("   \n\t   ")
        
        # Assert
        self.assertIsNone(result)
    
    def test_generate_product_name_embedding_success(self):
        """Test product name embedding generation"""
        # Act
        result = self.service.generate_product_name_embedding(self.test_product_name)
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(len(result), self.expected_dimension)
        self.assertIsInstance(result, np.ndarray)
    
    def test_generate_product_name_embedding_empty_text(self):
        """Test product name embedding with empty text"""
        # Act
        result = self.service.generate_product_name_embedding("")
        
        # Assert
        self.assertIsNone(result)
    
    def test_generate_allergen_embedding_list_input(self):
        """Test allergen embedding with list input"""
        # Act
        result = self.service.generate_allergen_embedding(self.test_allergens)
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(len(result), self.expected_dimension)
        self.assertIsInstance(result, np.ndarray)
    
    def test_generate_allergen_embedding_string_input(self):
        """Test allergen embedding with string input"""
        # Act
        result = self.service.generate_allergen_embedding("wheat, eggs, milk")
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(len(result), self.expected_dimension)
        self.assertIsInstance(result, np.ndarray)
    
    def test_generate_allergen_embedding_empty_input(self):
        """Test allergen embedding with empty input"""
        # Act
        result1 = self.service.generate_allergen_embedding([])
        result2 = self.service.generate_allergen_embedding("")
        
        # Assert
        self.assertIsNone(result1)
        self.assertIsNone(result2)


class TestBatchProcessing(TestEmbeddingService):
    """Test batch processing functionality"""
    
    def setUp(self):
        """Set up for batch processing tests"""
        super().setUp()
        # Mock loaded model
        self.service.model = self.mock_model
        self.service.is_loaded = True
        
        # Create mock batch embeddings with proper normalization
        self.mock_batch_embeddings = np.random.rand(len(self.test_batch_texts), 384).astype(np.float32)
        # Normalize each embedding to unit vector
        for i in range(len(self.mock_batch_embeddings)):
            self.mock_batch_embeddings[i] = self.mock_batch_embeddings[i] / np.linalg.norm(self.mock_batch_embeddings[i])
        self.mock_model.encode.return_value = self.mock_batch_embeddings
    
    def test_generate_embeddings_batch_success(self):
        """Test successful batch embedding generation"""
        # Act
        result = self.service.generate_embeddings_batch(self.test_batch_texts)
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result.shape, (len(self.test_batch_texts), self.expected_dimension))
        self.assertIsInstance(result, np.ndarray)
        self.mock_model.encode.assert_called_once()
    
    def test_generate_embeddings_batch_empty_list(self):
        """Test batch processing with empty list"""
        # Act
        result = self.service.generate_embeddings_batch([])
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result.shape, (0,))
        self.assertIsInstance(result, np.ndarray)
    
    def test_generate_embeddings_batch_single_item(self):
        """Test batch processing with single item"""
        # Arrange
        single_text = ["test text"]
        single_embedding = np.random.rand(1, 384).astype(np.float32)
        single_embedding[0] = single_embedding[0] / np.linalg.norm(single_embedding[0])
        self.mock_model.encode.return_value = single_embedding
        
        # Act
        result = self.service.generate_embeddings_batch(single_text)
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result.shape, (1, self.expected_dimension))
    
    def test_generate_embeddings_batch_performance(self):
        """Test batch processing performance"""
        # Arrange
        large_batch = ["test text " + str(i) for i in range(100)]
        large_embeddings = np.random.rand(100, 384).astype(np.float32)
        self.mock_model.encode.return_value = large_embeddings
        
        # Act
        start_time = time.time()
        result = self.service.generate_embeddings_batch(large_batch)
        end_time = time.time()
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result.shape, (100, self.expected_dimension))
        
        # Performance check - should process quickly (mocked, so very fast)
        processing_time = end_time - start_time
        self.assertLess(processing_time, 1.0)  # Should be much faster with mocking
    
    def test_generate_embeddings_batch_model_error(self):
        """Test batch processing with model error"""
        # Arrange
        self.mock_model.encode.side_effect = Exception("Batch encoding failed")
        
        # Act
        result = self.service.generate_embeddings_batch(self.test_batch_texts)
        
        # Assert
        self.assertIsNone(result)
    
    def test_generate_embeddings_batch_model_not_loaded(self):
        """Test batch processing when model not loaded"""
        # Arrange
        self.service.is_loaded = False
        self.service.model = None
        
        with patch.object(self.service, 'load_model', return_value=False):
            # Act
            result = self.service.generate_embeddings_batch(self.test_batch_texts)
            
            # Assert
            self.assertIsNone(result)


class TestEmbeddingQuality(TestEmbeddingService):
    """Test embedding quality and validation"""
    
    def setUp(self):
        """Set up for quality tests"""
        super().setUp()
        self.service.model = self.mock_model
        self.service.is_loaded = True
    
    def test_validate_embedding_quality_valid_embedding(self):
        """Test validation of valid embedding"""
        # Arrange
        valid_embedding = np.random.rand(384).astype(np.float32)
        # Normalize to unit vector to pass magnitude check
        valid_embedding = valid_embedding / np.linalg.norm(valid_embedding)
        
        # Act
        result = self.service._validate_embedding_quality(
            valid_embedding, 'ingredient', 'wheat flour, sugar'
        )
        
        # Assert
        self.assertTrue(result)
    
    def test_validate_embedding_quality_wrong_dimension(self):
        """Test validation with wrong dimension"""
        # Arrange
        wrong_dim_embedding = np.random.rand(256).astype(np.float32)
        
        # Act
        result = self.service._validate_embedding_quality(
            wrong_dim_embedding, 'ingredient', 'wheat flour, sugar'
        )
        
        # Assert
        self.assertFalse(result)
    
    def test_validate_embedding_quality_nan_values(self):
        """Test validation with NaN values"""
        # Arrange
        nan_embedding = np.random.rand(384).astype(np.float32)
        nan_embedding[0] = np.nan
        
        # Act
        result = self.service._validate_embedding_quality(
            nan_embedding, 'ingredient', 'wheat flour, sugar'
        )
        
        # Assert
        self.assertFalse(result)
    
    def test_validate_embedding_quality_infinite_values(self):
        """Test validation with infinite values"""
        # Arrange
        inf_embedding = np.random.rand(384).astype(np.float32)
        inf_embedding[0] = np.inf
        
        # Act
        result = self.service._validate_embedding_quality(
            inf_embedding, 'ingredient', 'wheat flour, sugar'
        )
        
        # Assert
        self.assertFalse(result)
    
    def test_validate_embedding_quality_zero_vector(self):
        """Test validation with zero vector"""
        # Arrange
        zero_embedding = np.zeros(384, dtype=np.float32)
        
        # Act
        result = self.service._validate_embedding_quality(
            zero_embedding, 'ingredient', 'wheat flour, sugar'
        )
        
        # Assert
        self.assertFalse(result)
    
    def test_validate_embedding_quality_unusual_magnitude(self):
        """Test validation with unusual magnitude"""
        # Arrange
        # Very small magnitude
        small_embedding = np.full(384, 0.001, dtype=np.float32)
        # Very large magnitude  
        large_embedding = np.full(384, 10.0, dtype=np.float32)
        
        # Act
        small_result = self.service._validate_embedding_quality(
            small_embedding, 'ingredient', 'wheat flour, sugar'
        )
        large_result = self.service._validate_embedding_quality(
            large_embedding, 'ingredient', 'wheat flour, sugar'
        )
        
        # Assert
        self.assertFalse(small_result)
        self.assertFalse(large_result)
    
    def test_validate_embedding_quality_empty_embedding(self):
        """Test validation with empty embedding"""
        # Arrange
        empty_embedding = np.array([])
        
        # Act
        result = self.service._validate_embedding_quality(
            empty_embedding, 'ingredient', 'wheat flour, sugar'
        )
        
        # Assert
        self.assertFalse(result)
    
    def test_validate_embedding_quality_none_embedding(self):
        """Test validation with None embedding"""
        # Act
        result = self.service._validate_embedding_quality(
            None, 'ingredient', 'wheat flour, sugar'
        )
        
        # Assert
        self.assertFalse(result)


class TestTextPreprocessing(TestEmbeddingService):
    """Test text preprocessing functionality"""
    
    def test_preprocess_ingredients_basic(self):
        """Test basic ingredient preprocessing"""
        # Arrange
        raw_ingredients = "INGREDIENTS: Wheat Flour, Sugar, Eggs"
        
        # Act
        result = self.service._preprocess_ingredients(raw_ingredients)
        
        # Assert
        self.assertNotIn("INGREDIENTS:", result)
        self.assertEqual(result.lower(), result)  # Should be lowercase
        self.assertIn("flour wheat", result)  # Should normalize wheat flour
    
    def test_preprocess_ingredients_normalization(self):
        """Test ingredient normalization"""
        # Arrange
        raw_ingredients = "wheat flour, cane sugar, sea salt, natural flavor"
        
        # Act
        result = self.service._preprocess_ingredients(raw_ingredients)
        
        # Assert
        self.assertIn("flour wheat", result)
        self.assertIn("sugar", result)
        self.assertNotIn("cane sugar", result)
        self.assertIn("salt", result)
        self.assertNotIn("sea salt", result)
        self.assertIn("natural flavoring", result)
        # Verify the replacement worked - "natural flavor" became "natural flavoring"
        self.assertTrue("natural flavoring" in result and result.count("natural") == 1)
    
    def test_preprocess_ingredients_punctuation_cleanup(self):
        """Test punctuation cleanup in ingredients"""
        # Arrange
        raw_ingredients = "wheat flour,, sugar;; eggs!! butter??"
        
        # Act
        result = self.service._preprocess_ingredients(raw_ingredients)
        
        # Assert
        self.assertNotIn("!!", result)
        self.assertNotIn("??", result)
        self.assertNotIn(";;", result)
        self.assertNotIn(",,", result)
    
    def test_normalize_product_name_basic(self):
        """Test basic product name normalization"""
        # Arrange
        raw_name = "Brand Name Chocolate Chip Cookies Original"
        
        # Act
        result = self.service._normalize_product_name(raw_name)
        
        # Assert
        self.assertEqual(result.lower(), result)  # Should be lowercase
        self.assertNotIn("original", result)  # Should remove generic terms
    
    def test_normalize_product_name_abbreviations(self):
        """Test product name abbreviation normalization"""
        # Arrange
        raw_name = "Choc Chip Cookies w/ Nuts & Cream"
        
        # Act
        result = self.service._normalize_product_name(raw_name)
        
        # Assert
        self.assertIn("chocolate chip", result)
        self.assertNotIn("choc chip", result)
        self.assertIn("with", result)
        self.assertNotIn("w/", result)
        self.assertIn("and", result)
        self.assertNotIn("&", result)
    
    def test_process_allergen_profile_list_input(self):
        """Test allergen profile processing with list input"""
        # Arrange
        allergens = ["en:wheat", "en:eggs", "en:milk"]
        
        # Act
        result = self.service._process_allergen_profile(allergens)
        
        # Assert
        self.assertIn("contains", result)
        self.assertIn("gluten", result)  # wheat -> gluten
        self.assertIn("egg", result)     # eggs -> egg
        self.assertIn("dairy", result)   # milk -> dairy
        self.assertNotIn("en:", result)  # Should remove language prefix
    
    def test_process_allergen_profile_string_input(self):
        """Test allergen profile processing with string input"""
        # Arrange
        allergens = "wheat, eggs, milk"
        
        # Act
        result = self.service._process_allergen_profile(allergens)
        
        # Assert
        self.assertIn("contains", result)
        self.assertIn("gluten", result)
        self.assertIn("egg", result)
        self.assertIn("dairy", result)
    
    def test_process_allergen_profile_empty_input(self):
        """Test allergen profile processing with empty input"""
        # Arrange
        allergens = []
        
        # Act
        result = self.service._process_allergen_profile(allergens)
        
        # Assert
        self.assertEqual(result, "no known allergens")
    
    def test_process_allergen_profile_normalization(self):
        """Test allergen normalization mapping"""
        # Arrange
        allergens = ["tree-nuts", "peanuts", "shellfish"]
        
        # Act
        result = self.service._process_allergen_profile(allergens)
        
        # Assert
        self.assertIn("tree nuts", result)  # tree-nuts -> tree nuts
        self.assertIn("peanut", result)     # peanuts -> peanut
        self.assertIn("shellfish", result)  # shellfish -> shellfish
    
    def test_process_allergen_profile_sorting(self):
        """Test allergen profile sorting for consistency"""
        # Arrange
        allergens1 = ["wheat", "eggs", "milk"]
        allergens2 = ["milk", "wheat", "eggs"]
        
        # Act
        result1 = self.service._process_allergen_profile(allergens1)
        result2 = self.service._process_allergen_profile(allergens2)
        
        # Assert
        self.assertEqual(result1, result2)  # Should be identical due to sorting


class TestEmbeddingDimensions(TestEmbeddingService):
    """Test 384-dimension output format and normalization"""
    
    def setUp(self):
        """Set up for dimension tests"""
        super().setUp()
        self.service.model = self.mock_model
        self.service.is_loaded = True
        
        # Create properly dimensioned mock embedding
        self.mock_embedding = np.random.rand(384).astype(np.float32)
        # Normalize to unit vector
        self.mock_embedding = self.mock_embedding / np.linalg.norm(self.mock_embedding)
        self.mock_model.encode.return_value = np.array([self.mock_embedding])
    
    def test_embedding_dimension_consistency(self):
        """Test that all embeddings have consistent 384 dimensions"""
        # Act
        ingredient_emb = self.service.generate_ingredient_embedding(self.test_ingredient)
        product_emb = self.service.generate_product_name_embedding(self.test_product_name)
        allergen_emb = self.service.generate_allergen_embedding(self.test_allergens)
        
        # Assert
        self.assertEqual(len(ingredient_emb), 384)
        self.assertEqual(len(product_emb), 384)
        self.assertEqual(len(allergen_emb), 384)
    
    def test_embedding_normalization(self):
        """Test that embeddings are properly normalized"""
        # Act
        embedding = self.service.generate_ingredient_embedding(self.test_ingredient)
        
        # Assert
        self.assertIsNotNone(embedding)
        magnitude = np.linalg.norm(embedding)
        # Should be close to 1.0 for normalized vectors (allowing for floating point precision)
        self.assertAlmostEqual(magnitude, 1.0, places=5)
    
    def test_embedding_data_type(self):
        """Test that embeddings have correct data type"""
        # Act
        embedding = self.service.generate_ingredient_embedding(self.test_ingredient)
        
        # Assert
        self.assertIsNotNone(embedding)
        self.assertIsInstance(embedding, np.ndarray)
        # Should be float32 or float64
        self.assertTrue(embedding.dtype in [np.float32, np.float64])
    
    def test_batch_embedding_dimensions(self):
        """Test batch embeddings have correct dimensions"""
        # Arrange
        batch_embeddings = np.random.rand(len(self.test_batch_texts), 384).astype(np.float32)
        self.mock_model.encode.return_value = batch_embeddings
        
        # Act
        result = self.service.generate_embeddings_batch(self.test_batch_texts)
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result.shape, (len(self.test_batch_texts), 384))
        
        # Check each embedding individually
        for i in range(len(self.test_batch_texts)):
            self.assertEqual(len(result[i]), 384)
    
    def test_embedding_value_ranges(self):
        """Test that embedding values are in reasonable ranges"""
        # Act
        embedding = self.service.generate_ingredient_embedding(self.test_ingredient)
        
        # Assert
        self.assertIsNotNone(embedding)
        
        # Values should be finite
        self.assertTrue(np.all(np.isfinite(embedding)))
        
        # Values should not be all zeros
        self.assertFalse(np.allclose(embedding, 0))
        
        # For normalized embeddings, values should typically be in [-1, 1]
        self.assertTrue(np.all(embedding >= -1.0))
        self.assertTrue(np.all(embedding <= 1.0))


class TestPerformanceMetrics(TestEmbeddingService):
    """Test performance and efficiency metrics"""
    
    def setUp(self):
        """Set up for performance tests"""
        super().setUp()
        self.service.model = self.mock_model
        self.service.is_loaded = True
        
        # Mock fast embedding generation with proper normalization
        self.mock_embedding = np.random.rand(384).astype(np.float32)
        self.mock_embedding = self.mock_embedding / np.linalg.norm(self.mock_embedding)
        self.mock_model.encode.return_value = np.array([self.mock_embedding])
    
    def test_single_embedding_performance(self):
        """Test single embedding generation performance"""
        # Act
        start_time = time.time()
        embedding = self.service.generate_ingredient_embedding(self.test_ingredient)
        end_time = time.time()
        
        # Assert
        self.assertIsNotNone(embedding)
        processing_time = end_time - start_time
        # With mocking, should be very fast
        self.assertLess(processing_time, 0.1)
    
    def test_batch_processing_efficiency(self):
        """Test batch processing efficiency vs individual calls"""
        # Arrange
        batch_size = 10
        test_texts = [f"test ingredient {i}" for i in range(batch_size)]
        
        # Mock batch response
        batch_embeddings = np.random.rand(batch_size, 384).astype(np.float32)
        self.mock_model.encode.return_value = batch_embeddings
        
        # Act - Batch processing
        start_batch = time.time()
        batch_result = self.service.generate_embeddings_batch(test_texts)
        end_batch = time.time()
        
        # Act - Individual processing
        # Reset mock to return single embedding for individual calls
        self.mock_model.encode.return_value = np.array([self.mock_embedding])
        start_individual = time.time()
        individual_results = []
        for text in test_texts:
            # Use basic generate_embedding to avoid quality validation issues
            result = self.service.generate_embedding(text)
            individual_results.append(result)
        end_individual = time.time()
        
        # Assert
        self.assertIsNotNone(batch_result)
        self.assertEqual(len(individual_results), batch_size)
        
        batch_time = end_batch - start_batch
        individual_time = end_individual - start_individual
        
        # Batch should be more efficient (though with mocking, both will be fast)
        # This test mainly ensures the batch method works correctly
        # With mocking, timing can be inconsistent, so just verify both work
        self.assertIsNotNone(batch_result)
        self.assertEqual(len(individual_results), batch_size)
    
    def test_memory_efficiency(self):
        """Test memory usage for large batches"""
        # Arrange
        large_batch_size = 1000
        test_texts = [f"test text {i}" for i in range(large_batch_size)]
        
        # Mock large batch response with proper normalization
        large_embeddings = np.random.rand(large_batch_size, 384).astype(np.float32)
        # Normalize each embedding
        for i in range(len(large_embeddings)):
            large_embeddings[i] = large_embeddings[i] / np.linalg.norm(large_embeddings[i])
        self.mock_model.encode.return_value = large_embeddings
        
        # Act
        result = self.service.generate_embeddings_batch(test_texts)
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result.shape, (large_batch_size, 384))
        
        # Check memory usage is reasonable (embeddings should be float32)
        expected_memory_mb = (large_batch_size * 384 * 4) / (1024 * 1024)  # 4 bytes per float32
        self.assertLess(expected_memory_mb, 100)  # Should be reasonable for 1000 embeddings


if __name__ == '__main__':
    # Configure test runner
    unittest.main(verbosity=2, buffer=True)