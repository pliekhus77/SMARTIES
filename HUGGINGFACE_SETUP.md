# Hugging Face Sentence Transformers Setup

This document describes the Hugging Face environment setup for the SMARTIES data processing pipeline, specifically for generating vector embeddings for food product analysis.

## ✅ Setup Complete

The following components have been successfully installed and configured:

### 1. Python Virtual Environment
- **Location**: `./venv/`
- **Python Version**: 3.13.0
- **Activation**: `.\venv\Scripts\activate.ps1` (Windows PowerShell)

### 2. Core Dependencies Installed
- **sentence-transformers**: 5.1.1 (Main embedding library)
- **torch**: 2.8.0 (PyTorch backend)
- **transformers**: 4.57.0 (Hugging Face transformers)
- **numpy**: 2.3.3 (Numerical computing)
- **pandas**: 2.3.3 (Data manipulation)
- **scipy**: 1.16.2 (Scientific computing)
- **scikit-learn**: 1.7.2 (Machine learning utilities)

### 3. Model Configuration
- **Model**: `all-MiniLM-L6-v2`
- **Embedding Dimensions**: 384 (optimized for performance vs quality)
- **Max Sequence Length**: 256 tokens
- **Cache Directory**: `./models_cache/`
- **Performance**: ~540 embeddings/second on CPU

### 4. Memory Management
- **CPU Threads**: 4 (optimized for development environment)
- **Batch Size**: 32 (balanced for memory and performance)
- **Normalization**: Enabled (cosine similarity ready)

## 📁 Files Created

| File | Purpose |
|------|---------|
| `test_huggingface_setup.py` | Comprehensive setup validation script |
| `huggingface_config.py` | Centralized configuration management |
| `embedding_service.py` | High-level embedding service interface |
| `requirements.txt` | Python dependency specification |
| `HUGGINGFACE_SETUP.md` | This documentation file |

## 🚀 Usage Examples

### Basic Embedding Generation
```python
from embedding_service import EmbeddingService

# Initialize service
service = EmbeddingService()

# Generate ingredient embedding
ingredients = "wheat flour, sugar, chocolate chips, eggs, butter"
embedding = service.generate_ingredient_embedding(ingredients)
print(f"Embedding shape: {embedding.shape}")  # (384,)
```

### Batch Processing
```python
# Process multiple products efficiently
ingredient_texts = [
    "organic almonds, sea salt",
    "milk chocolate, cocoa butter",
    "gluten-free oats, honey"
]

embeddings = service.generate_embeddings_batch(ingredient_texts)
print(f"Batch shape: {embeddings.shape}")  # (3, 384)
```

### Product-Specific Embeddings
```python
# Specialized methods for different data types
product_embedding = service.generate_product_name_embedding("Chocolate Chip Cookies")
allergen_embedding = service.generate_allergen_embedding(["wheat", "eggs", "milk"])
```

## 🔧 Configuration

The setup uses optimized configuration for the SMARTIES use case:

- **Model Choice**: `all-MiniLM-L6-v2` provides excellent quality-to-performance ratio
- **384 Dimensions**: Smaller than OpenAI embeddings (1536) but sufficient for food similarity
- **Local Caching**: Models cached locally for faster subsequent loads
- **CPU Optimized**: Configured for development without GPU requirements

## ✅ Validation Results

All setup tests passed successfully:

- ✅ **Model Cache Setup**: Local caching configured
- ✅ **Memory Management**: CPU threads optimized
- ✅ **Model Loading**: 7.99 seconds initial load, 1.57 seconds cached
- ✅ **Basic Embeddings**: 384-dimensional normalized vectors
- ✅ **Batch Processing**: 543.8 items/second processing rate

## 🔄 Next Steps

This environment is ready for integration into the data processing pipeline:

1. **Task 2.2**: Create embedding service interface and implementation ✅ (Completed)
2. **Task 2.3**: Implement embedding generation for product data
3. **Task 2.4**: Write unit tests for Hugging Face embedding service
4. **Task 3.x**: Integration with MongoDB Atlas and data processing pipeline

## 🛠 Maintenance

### Updating Dependencies
```bash
# Activate environment
.\venv\Scripts\activate.ps1

# Update packages
pip install --upgrade sentence-transformers torch transformers

# Verify setup
python test_huggingface_setup.py
```

### Model Cache Management
- **Location**: `./models_cache/`
- **Size**: ~90MB for all-MiniLM-L6-v2
- **Cleanup**: Delete cache directory to force re-download

### Performance Monitoring
- Use `test_huggingface_setup.py` to benchmark performance
- Monitor memory usage during batch processing
- Adjust batch size in `huggingface_config.py` if needed

## 📊 Performance Benchmarks

Based on setup validation:

| Metric | Value |
|--------|-------|
| Model Load Time (First) | 7.99 seconds |
| Model Load Time (Cached) | 1.57 seconds |
| Single Embedding | ~10ms |
| Batch Processing | 543.8 items/second |
| Memory Usage | ~200MB (model + overhead) |
| Embedding Dimension | 384 |
| Normalization | L2 normalized (ready for cosine similarity) |

## 🔍 Troubleshooting

### Common Issues

1. **Python not found**: Use `py` command instead of `python` on Windows
2. **Symlink warnings**: Disabled via environment variable
3. **Memory issues**: Reduce batch size in configuration
4. **Slow performance**: Ensure CPU threads are optimized

### Validation Commands
```bash
# Test complete setup
python test_huggingface_setup.py

# Test embedding service
python embedding_service.py

# Check configuration
python huggingface_config.py
```

---

**Status**: ✅ **COMPLETE** - Ready for next task (2.2)  
**Requirements Satisfied**: 2.1, 2.5  
**Integration Ready**: Yes