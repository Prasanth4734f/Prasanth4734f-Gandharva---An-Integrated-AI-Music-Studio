# Gandharva Music Retrieval Backend

A high-quality, retrieval-based music engine designed for Anti Gravity AI projects. It understands natural language prompts and retrieves the best-matching royalty-free tracks from professional music libraries.

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Setup Environment**:
   Ensure you have a `.env` file in the `server` directory with the following content:
   ```env
   PORT=3000
   JAMENDO_CLIENT_ID=56d30c11
   DEBUG=true
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```

## 📡 API Endpoint

### POST `/api/generate-music`

**Request Body**:
```json
{
  "prompt": "Chill lofi calm music at forest"
}
```

**Successful Response**:
```json
{
  "success": true,
  "title": "Forest Breezes",
  "audioUrl": "https://...",
  "source": "Jamendo",
  "tags": ["lofi", "ambient", "nature"]
}
```

## 🛠️ Testing with Postman

1. Create a new **POST** request.
2. URL: `http://localhost:3000/api/generate-music`
3. Headers: `Content-Type: application/json`
4. Body: Select `raw` and `JSON`, then paste the request body example above.

## 📁 Architecture
- `src/controllers`: Request handling and orchestration.
- `src/services`: Integration with external music APIs (Jamendo, FMA).
- `src/utils`: Logging and helper utilities.
- `src/routes`: API endpoint definitions.
