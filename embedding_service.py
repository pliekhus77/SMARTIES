#!/usr/bin/env python3
"""
Embedding Service for SMARTIES Data Processing Pipeline
Provides high-level interface for generating embeddings using Sentence Transformers
"""

import time
import logging
from typing import List, Union, Optional, Dict, Any
import numpy as np
from sentence_transformers import SentenceTransformer
from huggingface_config import HuggingFaceConfig

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Service class for generating embeddings using Sentence Transformers
    Optimized for food product ingredient analysis
    """
    
    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize the embedding service
        
        Args:
            model_name: Optional model name override (defaults to config)
        """
        # Setup environment
        HuggingFaceConfig.setup_environment()
        
        # Initialize model
        self.model_name = model_name or HuggingFaceConfig.MODEL_NAME
        self.model = None
        self.is_loaded = False
        
        # Configuration
        self.config = HuggingFaceConfig()
        
        logger.info(f"EmbeddingService initialized with model: {self.model_name}")
    
    def load_model(self) -> bool:
        """
        Load the sentence transformer model
        
        Returns:
            bool: True if model loaded successfully
        """
        if self.is_loaded:
            logger.info("Model already loaded")
            return True
        
        try:
            logger.info(f"Loading model: {self.model_name}")
            start_time = time.time()
            
            self.model = SentenceTransformer(self.model_name)
            
            load_time = time.time() - start_time
            self.is_loaded = True
            
            logger.info(f"Model loaded successfully in {load_time:.2f} seconds")
            logger.info(f"Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
            logger.info(f"Max sequence length: {self.model.max_seq_length}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def generate_embedding(self, text: str) -> Optional[np.ndarray]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text to embed
            
        Returns:
            numpy array of embedding or None if failed
        """
        if not self.is_loaded and not self.load_model():
            return None
        
        try:
            embedding = self.model.encode([text], **self.config.get_encoding_params())
            return embedding[0]  # Return single embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None
    
    def generate_embeddings_batch(self, texts: List[str]) -> Optional[np.ndarray]:
        """
        Generate embeddings for multiple texts efficiently
        
        Args:
            texts: List of texts to embed
            
        Returns:
            numpy array of embeddings or None if failed
        """
        if not self.is_loaded and not self.load_model():
            return None
        
        if not texts:
            logger.warning("Empty text list provided")
            return np.array([])
        
        try:
            logger.info(f"Generating embeddings for {len(texts)} texts")
            start_time = time.time()
            
            embeddings = self.model.encode(texts, **self.config.get_encoding_params())
            
            generation_time = time.time() - start_time
            rate = len(texts) / generation_time if generation_time > 0 else 0
            
            logger.info(f"Generated {len(texts)} embeddings in {generation_time:.3f}s ({rate:.1f} items/sec)")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            return None
    
    def generate_ingredient_embedding(self, ingredients_text: str) -> Optional[np.ndarray]:
        """
        Generate embedding specifically for ingredient text
        Applies preprocessing optimized for food ingredients
        
        Args:
            ingredients_text: Raw ingredient text from product
            
        Returns:
            numpy array of embedding or None if failed
        """
        if not ingredients_text or not ingredients_text.strip():
            logger.warning("Empty ingredients text provided")
            return None
        
        # Basic preprocessing for ingredients
        processed_text = self._preprocess_ingredients(ingredients_text)
        return self.generate_embedding(processed_text)
    
    def generate_product_name_embedding(self, product_name: str) -> Optional[np.ndarray]:
        """
        Generate embedding for product name
        
        Args:
            product_name: Product name text
            
        Returns:
            numpy array of embedding or None if failed
        """
        if not product_name or not product_name.strip():
            logger.warning("Empty product name provided")
            return None
        
        # Basic preprocessing for product names
        processed_name = product_name.strip().lower()
        return self.generate_embedding(processed_name)
    
    def generate_allergen_embedding(self, allergens: Union[str, List[str]]) -> Optional[np.ndarray]:
        """
        Generate embedding for allergen information
        
        Args:
            allergens: Allergen text or list of allergens
            
        Returns:
            numpy array of embedding or None if failed
        """
        if not allergens:
            logger.warning("Empty allergens provided")
            return None
        
        # Convert to text if list
        if isinstance(allergens, list):
            allergen_text = ", ".join(allergens)
        else:
            allergen_text = str(allergens)
        
        return self.generate_embedding(allergen_text.strip().lower())
    
    def _preprocess_ingredients(self, ingredients_text: str) -> str:
        """
        Preprocess ingredient text for better embedding quality
        
        Args:
            ingredients_text: Raw ingredient text
            
        Returns:
            Processed ingredient text
        """
        # Basic preprocessing - can be enhanced later
        processed = ingredients_text.strip().lower()
        
        # Remove common prefixes/suffixes that don't add semantic value
        processed = processed.replace("ingredients:", "").strip()
        processed = processed.replace("contains:", "").strip()
        
        return processed
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model
        
        Returns:
            Dictionary with model information
        """
        info = self.config.get_model_info()
        info['is_loaded'] = self.is_loaded
        
        if self.is_loaded and self.model:
            info['actual_embedding_dim'] = self.model.get_sentence_embedding_dimension()
            info['actual_max_seq_length'] = self.model.max_seq_length
        
        return info

# Example usage and testing
if __name__ == "__main__":
    print("🧪 Testing Embedding Service")
    print("=" * 40)
    
    # Initialize service
    service = EmbeddingService()
    
    # Test ingredient embedding
    ingredients = "wheat flour, sugar, chocolate chips, eggs, butter, vanilla extract"
    ingredient_embedding = service.generate_ingredient_embedding(ingredients)
    
    if ingredient_embedding is not None:
        print(f"✓ Ingredient embedding shape: {ingredient_embedding.shape}")
        print(f"✓ Ingredient embedding norm: {np.linalg.norm(ingredient_embedding):.3f}")
    
    # Test product name embedding
    product_name = "Chocolate Chip Cookies"
    name_embedding = service.generate_product_name_embedding(product_name)
    
    if name_embedding is not None:
        print(f"✓ Product name embedding shape: {name_embedding.shape}")
    
    # Test allergen embedding
    allergens = ["wheat", "eggs", "milk"]
    allergen_embedding = service.generate_allergen_embedding(allergens)
    
    if allergen_embedding is not None:
        print(f"✓ Allergen embedding shape: {allergen_embedding.shape}")
    
    # Test batch processing
    test_texts = [
        "organic almonds, sea salt",
        "milk chocolate, cocoa butter",
        "gluten-free oats, honey"
    ]
    
    batch_embeddings = service.generate_embeddings_batch(test_texts)
    if batch_embeddings is not None:
        print(f"✓ Batch embeddings shape: {batch_embeddings.shape}")
    
    # Display model info
    print("\n📊 Model Information:")
    info = service.get_model_info()
    for key, value in info.items():
        print(f"{key:.<25} {value}")
    
    print("\n✅ Embedding service ready for integration!")