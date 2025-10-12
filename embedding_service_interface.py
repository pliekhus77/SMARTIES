#!/usr/bin/env python3
"""
Embedding Service Interface for Node.js Integration
Provides command-line interface to the embedding service for TypeScript integration
"""

import sys
import json
import traceback
from typing import Dict, Any, List
from embedding_service import EmbeddingService

class EmbeddingServiceInterface:
    """
    Command-line interface for the embedding service
    Handles JSON input/output for Node.js integration
    """
    
    def __init__(self):
        self.service = EmbeddingService()
        self.service.load_model()  # Ensure model is loaded
    
    def handle_command(self, command: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a command with arguments and return JSON response
        
        Args:
            command: Command name to execute
            args: Command arguments as dictionary
            
        Returns:
            Dictionary response for JSON serialization
        """
        try:
            if command == 'get_model_info':
                return self.get_model_info()
            elif command == 'generate_ingredient_embedding':
                return self.generate_ingredient_embedding(args.get('text', ''))
            elif command == 'generate_product_name_embedding':
                return self.generate_product_name_embedding(args.get('text', ''))
            elif command == 'generate_allergen_embedding':
                return self.generate_allergen_embedding(args.get('text', ''))
            elif command == 'generate_embeddings_batch':
                return self.generate_embeddings_batch(args.get('texts', []))
            else:
                return {
                    'success': False,
                    'error': f'Unknown command: {command}'
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        info = self.service.get_model_info()
        return {
            'success': True,
            **info
        }
    
    def generate_ingredient_embedding(self, text: str) -> Dict[str, Any]:
        """Generate ingredient embedding"""
        if not text:
            return {
                'success': False,
                'error': 'Text is required'
            }
        
        embedding = self.service.generate_ingredient_embedding(text)
        if embedding is not None:
            return {
                'success': True,
                'embedding': embedding.tolist()
            }
        else:
            return {
                'success': False,
                'error': 'Failed to generate embedding'
            }
    
    def generate_product_name_embedding(self, text: str) -> Dict[str, Any]:
        """Generate product name embedding"""
        if not text:
            return {
                'success': False,
                'error': 'Text is required'
            }
        
        embedding = self.service.generate_product_name_embedding(text)
        if embedding is not None:
            return {
                'success': True,
                'embedding': embedding.tolist()
            }
        else:
            return {
                'success': False,
                'error': 'Failed to generate embedding'
            }
    
    def generate_allergen_embedding(self, text: str) -> Dict[str, Any]:
        """Generate allergen embedding"""
        if not text:
            return {
                'success': False,
                'error': 'Text is required'
            }
        
        embedding = self.service.generate_allergen_embedding(text)
        if embedding is not None:
            return {
                'success': True,
                'embedding': embedding.tolist()
            }
        else:
            return {
                'success': False,
                'error': 'Failed to generate embedding'
            }
    
    def generate_embeddings_batch(self, texts: List[str]) -> Dict[str, Any]:
        """Generate embeddings for multiple texts"""
        if not texts or not isinstance(texts, list):
            return {
                'success': False,
                'error': 'Texts must be a non-empty list'
            }
        
        embeddings = self.service.generate_embeddings_batch(texts)
        if embeddings is not None:
            return {
                'success': True,
                'embeddings': embeddings.tolist()
            }
        else:
            return {
                'success': False,
                'error': 'Failed to generate batch embeddings'
            }

def main():
    """Main entry point for command-line interface"""
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python embedding_service_interface.py <command> <args_json>'
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    try:
        args = json.loads(sys.argv[2])
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON arguments: {e}'
        }))
        sys.exit(1)
    
    # Create interface and handle command
    interface = EmbeddingServiceInterface()
    result = interface.handle_command(command, args)
    
    # Output JSON result
    print(json.dumps(result))

if __name__ == "__main__":
    main()