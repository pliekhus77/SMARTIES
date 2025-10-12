# SMARTIES Product Search API

REST API endpoints for product search, dietary analysis, and personalized recommendations.

## Base URL
```
http://localhost:3001/api/products
```

## Endpoints

### 1. UPC Lookup (Sub-100ms)
**GET** `/upc/{upc}`

Fast product lookup by UPC barcode.

**Parameters:**
- `upc` (path): UPC barcode (11-14 digits)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "upc": "123456789012",
    "name": "Organic Almond Milk",
    "ingredients": ["almonds", "water", "sea salt"],
    "allergens": ["tree nuts"],
    "dietaryFlags": {
      "vegan": true,
      "vegetarian": true,
      "glutenFree": true
    }
  },
  "responseTime": 45,
  "searchStrategy": "upc"
}
```

### 2. Semantic Search
**POST** `/search`

Advanced product search with similarity matching.

**Request Body:**
```json
{
  "query": "organic almond milk",
  "filters": {
    "allergens": ["peanuts"],
    "dietary": ["vegan", "gluten_free"],
    "maxResults": 20,
    "similarityThreshold": 0.7
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "totalResults": 15,
    "searchStrategy": "vector"
  },
  "responseTime": 234
}
```

### 3. Dietary Analysis
**POST** `/analyze`

Comprehensive dietary and allergen analysis for a product.

**Request Body:**
```json
{
  "upc": "123456789012",
  "userAllergens": ["peanuts", "tree nuts"],
  "dietaryRestrictions": [
    { "type": "vegan", "required": true },
    { "type": "gluten_free", "required": true }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {...},
    "allergenAnalysis": {
      "detectedAllergens": [
        {
          "allergen": "tree nuts",
          "riskLevel": "high",
          "confidence": 0.95,
          "reason": "Listed in allergen tags"
        }
      ],
      "overallRiskLevel": "danger",
      "confidence": 0.95
    },
    "complianceAnalysis": {
      "overallCompliance": true,
      "results": {
        "vegan": {
          "compliant": true,
          "confidence": 0.9
        }
      }
    }
  },
  "responseTime": 156
}
```

### 4. Product Recommendations
**POST** `/recommendations`

Personalized product recommendations and safer alternatives.

**Request Body (Personalized):**
```json
{
  "userProfile": {
    "allergens": ["peanuts"],
    "dietaryRestrictions": [
      { "type": "vegan", "required": true }
    ],
    "preferences": ["organic", "non-gmo"],
    "scanHistory": ["123456789012"]
  },
  "maxResults": 15
}
```

**Request Body (Safer Alternatives):**
```json
{
  "baseProduct": "123456789012",
  "userProfile": {
    "allergens": ["peanuts"],
    "dietaryRestrictions": [
      { "type": "vegan", "required": true }
    ],
    "preferences": ["organic"]
  },
  "maxResults": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "product": {...},
        "score": 0.87,
        "confidence": 0.92,
        "reasons": [
          "Safe from your allergens",
          "Meets all dietary requirements",
          "Matches preferences: organic"
        ],
        "safetyLevel": "safe"
      }
    ],
    "count": 8
  },
  "responseTime": 445
}
```

### 5. Performance Metrics
**GET** `/metrics?timeWindow=5`

API performance statistics and health monitoring.

**Parameters:**
- `timeWindow` (query): Time window in minutes (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "upcLookup": {
        "averageResponseTime": 67.3,
        "p95ResponseTime": 89,
        "successRate": 99.2,
        "throughput": 45.6
      }
    },
    "alerts": [
      "UPC lookup performance degraded: 105.2ms avg (target: <100ms)"
    ],
    "thresholds": {
      "upc_performance": false,
      "vector_performance": true
    }
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error description",
  "responseTime": 123
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (product not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **Limit:** 1000 requests per 15 minutes per IP
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Performance Targets

- **UPC Lookup:** <100ms average response time
- **Semantic Search:** <500ms average response time
- **Dietary Analysis:** <300ms average response time
- **Recommendations:** <2000ms average response time

## Example Usage

### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3001/api/products/upc/123456789012');
const data = await response.json();

if (data.success) {
  console.log('Product:', data.data.name);
} else {
  console.error('Error:', data.error);
}
```

### cURL
```bash
# UPC Lookup
curl "http://localhost:3001/api/products/upc/123456789012"

# Semantic Search
curl -X POST "http://localhost:3001/api/products/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "organic milk", "filters": {"maxResults": 10}}'

# Dietary Analysis
curl -X POST "http://localhost:3001/api/products/analyze" \
  -H "Content-Type: application/json" \
  -d '{"upc": "123456789012", "userAllergens": ["peanuts"]}'
```

## Development

### Starting the Server
```bash
npm run dev:api
# or
node src/api/server.ts
```

### Environment Variables
```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=smarties_db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
NODE_ENV=development
```
