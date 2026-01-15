# Nepali IMDB Crawler

## Overview

This Python script crawls IMDB to extract Nepali movies data. It uses BeautifulSoup and requests to scrape IMDB pages and extract comprehensive movie information.

## Setup

### 1. Install Python Dependencies

```bash
cd scripts
pip3 install -r requirements.txt
```

Or install individually:
```bash
pip3 install beautifulsoup4 requests lxml
```

### 2. Run the Crawler

```bash
python3 nepali_imdb_crawler.py
```

This will:
- Search IMDB for Nepali movies
- Extract movie data (title, year, rating, genres, etc.)
- Save results to `nepali_movies_imdb.json`

## Features

- ✅ Searches IMDB by country (Nepal)
- ✅ Searches by keywords (Nepali, Kathmandu, etc.)
- ✅ Extracts comprehensive movie data
- ✅ Gets ratings, genres, descriptions
- ✅ Extracts poster URLs
- ✅ Deduplicates results
- ✅ Sorts by rating

## Output

The crawler generates `nepali_movies_imdb.json` with movie data:

```json
[
  {
    "imdb_id": "tt1234567",
    "title": "Movie Title",
    "year": 2020,
    "rating": 8.5,
    "runtime": 120,
    "genres": ["Drama", "Comedy"],
    "description": "Movie description...",
    "poster_url": "https://...",
    "imdb_url": "https://www.imdb.com/title/tt1234567/"
  }
]
```

## API Integration

The Next.js app automatically:
1. Runs the crawler (or uses cached data)
2. Enriches IMDB data with Simkl/TMDB data
3. Gets better posters and metadata
4. Serves via `/api/nepali-imdb`

## Usage in Next.js

The crawler is integrated into the app:

```typescript
// Automatically used in homepage
fetch('/api/nepali-imdb')

// Force refresh
fetch('/api/nepali-imdb?refresh=true')
```

## Rate Limiting

The crawler includes delays between requests to be respectful:
- 0.5s delay between search results
- 1s delay between keyword searches

## Notes

- First run may take a few minutes
- Results are cached in `nepali_movies_imdb.json`
- Use `?refresh=true` to force re-crawl
- IMDB data is enriched with Simkl for better posters




