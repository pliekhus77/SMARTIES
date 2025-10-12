#!/usr/bin/env python3
"""
MongoDB Atlas M0 Setup and Configuration Script
Tests connection and sets up basic infrastructure for SMARTIES data ingestion
"""

import os
import sys
import time
from typing import Dict, Any, Optional, List
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    import certifi
except ImportError:
    logger.error("Required packages not installed. Run: pip install pymongo certifi")
    sys.exit(1)

class MongoAtlasSetup:
    """MongoDB Atlas M0 setup and configuration for SMARTIES"""
    
    def __init__(self):
        """Initialize MongoDB Atlas connection"""
        self.client = None
        self.db = None
        self.connection_string = None
        self.database_name = None
        
        # Load environment variables
        self._load_environment()
    
    def _load_environment(self):
        """Load MongoDB connection details from environment"""
        # Try to load from .env file
        env_file = Path('.env')
        if env_file.exists():
            logger.info("Loading environment fr