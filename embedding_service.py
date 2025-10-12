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
        Applies preprocessing optimized for food ingredients with normalization
        
        Args:
            ingredients_text: Raw ingredient text from product
            
        Returns:
            numpy array of embedding or None if failed
        """
        if not ingredients_text or not ingredients_text.strip():
            logger.warning("Empty ingredients text provided")
            return None
        
        # Enhanced preprocessing for ingredients with normalization
        processed_text = self._preprocess_ingredients(ingredients_text)
        embedding = self.generate_embedding(processed_text)
        
        if embedding is not None:
            # Validate embedding quality and consistency
            if not self._validate_embedding_quality(embedding, 'ingredient', processed_text):
                logger.warning(f"Embedding quality validation failed for ingredient: {processed_text[:50]}...")
                return None
        
        return embedding
    
    def generate_product_name_embedding(self, product_name: str) -> Optional[np.ndarray]:
        """
        Generate embedding for product name with text normalization
        
        Args:
            product_name: Product name text
            
        Returns:
            numpy array of embedding or None if failed
        """
        if not product_name or not product_name.strip():
            logger.warning("Empty product name provided")
            return None
        
        # Enhanced preprocessing for product names with normalization
        processed_name = self._normalize_product_name(product_name)
        embedding = self.generate_embedding(processed_name)
        
        if embedding is not None:
            # Validate embedding quality and consistency
            if not self._validate_embedding_quality(embedding, 'product_name', processed_name):
                logger.warning(f"Embedding quality validation failed for product name: {processed_name[:50]}...")
                return None
        
        return embedding
    
    def generate_allergen_embedding(self, allergens: Union[str, List[str]]) -> Optional[np.ndarray]:
        """
        Generate embedding for allergen information from allergen tags
        
        Args:
            allergens: Allergen text or list of allergens
            
        Returns:
            numpy array of embedding or None if failed
        """
        if not allergens:
            logger.warning("Empty allergens provided")
            return None
        
        # Process allergen profile from tags
        processed_allergens = self._process_allergen_profile(allergens)
        embedding = self.generate_embedding(processed_allergens)
        
        if embedding is not None:
            # Validate embedding quality and consistency
            if not self._validate_embedding_quality(embedding, 'allergen', processed_allergens):
                logger.warning(f"Embedding quality validation failed for allergens: {processed_allergens[:50]}...")
                return None
        
        return embedding
    
    def _preprocess_ingredients(self, ingredients_text: str) -> str:
        """
        Preprocess ingredient text for better embedding quality with enhanced normalization
        
        Args:
            ingredients_text: Raw ingredient text
            
        Returns:
            Processed ingredient text
        """
        # Enhanced preprocessing for ingredients
        processed = ingredients_text.strip().lower()
        
        # Remove common prefixes/suffixes that don't add semantic value
        processed = processed.replace("ingredients:", "").strip()
        processed = processed.replace("contains:", "").strip()
        processed = processed.replace("may contain:", "").strip()
        
        # Normalize common ingredient variations
        processed = processed.replace("wheat flour", "flour wheat")
        processed = processed.replace("cane sugar", "sugar")
        processed = processed.replace("sea salt", "salt")
        processed = processed.replace("natural flavor", "natural flavoring")
        processed = processed.replace("artificial flavor", "artificial flavoring")
        
        # Remove excessive punctuation and normalize spacing
        import re
        processed = re.sub(r'[^\w\s,.-]', '', processed)  # Keep only word chars, spaces, commas, periods, hyphens
        processed = re.sub(r'\s+', ' ', processed)  # Normalize whitespace
        processed = re.sub(r',\s*,', ',', processed)  # Remove duplicate commas
        
        return processed.strip()
    
    def _normalize_product_name(self, product_name: str) -> str:
        """
        Normalize product name text for consistent embedding generation
        
        Args:
            product_name: Raw product name
            
        Returns:
            Normalized product name
        """
        # Enhanced normalization for product names
        processed = product_name.strip().lower()
        
        # Remove brand-specific suffixes that don't add semantic value
        import re
        processed = re.sub(r'\b(brand|co\.|inc\.|ltd\.|llc)\b', '', processed)
        processed = re.sub(r'\b(original|classic|traditional)\b', '', processed)
        
        # Normalize common product name variations
        processed = processed.replace("choc chip", "chocolate chip")
        processed = processed.replace("choc. chip", "chocolate chip")
        processed = processed.replace("w/", "with")
        processed = processed.replace("&", "and")
        
        # Remove excessive punctuation and normalize spacing
        processed = re.sub(r'[^\w\s-]', '', processed)  # Keep only word chars, spaces, hyphens
        processed = re.sub(r'\s+', ' ', processed)  # Normalize whitespace
        processed = re.sub(r'-+', '-', processed)  # Normalize hyphens
        
        return processed.strip()
    
    def _process_allergen_profile(self, allergens: Union[str, List[str]]) -> str:
        """
        Process allergen profile from allergen tags for consistent embedding
        
        Args:
            allergens: Allergen text or list of allergen tags
            
        Returns:
            Processed allergen profile text
        """
        # Convert to list if string
        if isinstance(allergens, str):
            # Split on common delimiters
            allergen_list = [a.strip() for a in allergens.replace(',', ' ').replace(';', ' ').split()]
        else:
            allergen_list = [str(a).strip() for a in allergens]
        
        # Normalize allergen names
        normalized_allergens = []
        for allergen in allergen_list:
            if not allergen:
                continue
                
            # Remove common prefixes from OpenFoodFacts tags
            normalized = allergen.lower()
            normalized = normalized.replace("en:", "")  # Remove language prefix
            normalized = normalized.replace("allergens:", "")
            
            # Normalize common allergen variations
            allergen_mapping = {
                "milk": "dairy",
                "eggs": "egg",
                "tree-nuts": "tree nuts",
                "tree_nuts": "tree nuts",
                "peanuts": "peanut",
                "shellfish": "shellfish",
                "fish": "fish",
                "wheat": "gluten",
                "soy": "soy",
                "sesame": "sesame"
            }
            
            normalized = allergen_mapping.get(normalized, normalized)
            
            if normalized and normalized not in normalized_allergens:
                normalized_allergens.append(normalized)
        
        # Create allergen profile text
        if not normalized_allergens:
            return "no known allergens"
        
        # Sort for consistency
        normalized_allergens.sort()
        return "contains " + ", ".join(normalized_allergens)
    
    def _validate_embedding_quality(self, embedding: np.ndarray, embedding_type: str, original_text: str) -> bool:
        """
        Validate embedding quality and consistency
        
        Args:
            embedding: Generated embedding vector
            embedding_type: Type of embedding (ingredient, product_name, allergen)
            original_text: Original text that was embedded
            
        Returns:
            True if embedding passes quality checks
        """
        try:
            # Check basic properties
            if embedding is None or len(embedding) == 0:
                logger.warning(f"Empty embedding generated for {embedding_type}")
                return False
            
            # Check dimension
            expected_dim = 384  # all-MiniLM-L6-v2 dimension
            if len(embedding) != expected_dim:
                logger.warning(f"Unexpected embedding dimension: {len(embedding)}, expected {expected_dim}")
                return False
            
            # Check for NaN or infinite values
            if np.any(np.isnan(embedding)) or np.any(np.isinf(embedding)):
                logger.warning(f"Embedding contains NaN or infinite values for {embedding_type}")
                return False
            
            # Check embedding magnitude (should be normalized)
            magnitude = np.linalg.norm(embedding)
            if magnitude < 0.1 or magnitude > 2.0:  # Reasonable bounds for normalized embeddings
                logger.warning(f"Unusual embedding magnitude: {magnitude:.3f} for {embedding_type}")
                return False
            
            # Check for zero vector (indicates potential model issue)
            if np.allclose(embedding, 0, atol=1e-6):
                logger.warning(f"Zero embedding generated for {embedding_type}")
                return False
            
            # Type-specific validation
            if embedding_type == 'ingredient':
                # Ingredients should have reasonable semantic content
                if len(original_text.split()) < 1:
                    logger.warning("Ingredient text too short for meaningful embedding")
                    return False
            
            elif embedding_type == 'product_name':
                # Product names should not be too generic
                generic_terms = ['product', 'item', 'food', 'snack']
                if original_text.strip() in generic_terms:
                    logger.warning(f"Product name too generic: {original_text}")
                    return False
            
            elif embedding_type == 'allergen':
                # Allergen embeddings should have consistent format
                if not (original_text.startswith('contains') or original_text.startswith('no known')):
                    logger.warning(f"Allergen text format unexpected: {original_text}")
                    return False
            
            # Consistency check - embedding should be reproducible
            # (This could be enhanced with a cache of previous embeddings for the same text)
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating embedding quality: {e}")
            return False
    
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