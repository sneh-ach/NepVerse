#!/usr/bin/env python3
"""
Nepali IMDB Crawler
Extracts Nepali movies data from IMDB and analyzes it.
Uses BeautifulSoup and requests to scrape IMDB pages.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from typing import List, Dict, Optional
from urllib.parse import quote, urljoin

class NepaliIMDBCrawler:
    """Crawler to extract Nepali movies from IMDB"""
    
    def __init__(self):
        self.base_url = "https://www.imdb.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def search_nepali_movies(self, query: str = "Nepal", max_results: int = 100) -> List[Dict]:
        """
        Search IMDB for Nepali movies
        """
        search_url = f"{self.base_url}/search/title/"
        params = {
            'title': query,
            'title_type': 'feature',
            'countries': 'np',  # Nepal country code
            'count': max_results
        }
        
        try:
            response = self.session.get(search_url, params=params, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            movies = []
            results = soup.find_all('div', class_='lister-item')
            
            for item in results[:max_results]:
                movie_data = self._extract_movie_data(item)
                if movie_data:
                    movies.append(movie_data)
                time.sleep(0.5)  # Be respectful with requests
            
            return movies
        except Exception as e:
            print(f"Error searching IMDB: {e}")
            return []
    
    def search_by_keywords(self, keywords: List[str], max_per_keyword: int = 20) -> List[Dict]:
        """
        Search for Nepali movies using multiple keywords
        """
        all_movies = []
        seen_ids = set()
        
        search_queries = [
            "Nepal",
            "Nepali",
            "Kathmandu",
            "Nepal movie",
            "Nepali film",
            "Nepal cinema",
        ] + keywords
        
        for query in search_queries:
            print(f"Searching for: {query}")
            movies = self.search_nepali_movies(query, max_per_keyword)
            
            for movie in movies:
                imdb_id = movie.get('imdb_id')
                if imdb_id and imdb_id not in seen_ids:
                    seen_ids.add(imdb_id)
                    all_movies.append(movie)
            
            time.sleep(1)  # Rate limiting
        
        return all_movies
    
    def get_movie_details(self, imdb_id: str) -> Optional[Dict]:
        """
        Get detailed information about a specific movie by IMDB ID
        """
        url = f"{self.base_url}/title/{imdb_id}/"
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            return self._extract_detailed_movie_data(soup, imdb_id)
        except Exception as e:
            print(f"Error fetching movie details for {imdb_id}: {e}")
            return None
    
    def _extract_movie_data(self, item) -> Optional[Dict]:
        """
        Extract movie data from a search result item
        """
        try:
            # Title and link
            title_elem = item.find('h3', class_='lister-item-header')
            if not title_elem:
                return None
            
            title_link = title_elem.find('a')
            if not title_link:
                return None
            
            title = title_link.text.strip()
            imdb_path = title_link.get('href', '')
            imdb_id = re.search(r'/title/(tt\d+)/', imdb_path)
            imdb_id = imdb_id.group(1) if imdb_id else None
            
            # Year
            year_elem = title_elem.find('span', class_='lister-item-year')
            year = None
            if year_elem:
                year_text = year_elem.text.strip()
                year_match = re.search(r'(\d{4})', year_text)
                year = int(year_match.group(1)) if year_match else None
            
            # Rating
            rating_elem = item.find('div', class_='ratings-imdb-rating')
            rating = None
            if rating_elem:
                rating_text = rating_elem.get('data-value', '')
                try:
                    rating = float(rating_text)
                except:
                    pass
            
            # Runtime
            runtime_elem = item.find('span', class_='runtime')
            runtime = None
            if runtime_elem:
                runtime_text = runtime_elem.text.strip()
                runtime_match = re.search(r'(\d+)', runtime_text)
                runtime = int(runtime_match.group(1)) if runtime_match else None
            
            # Genres
            genre_elem = item.find('span', class_='genre')
            genres = []
            if genre_elem:
                genres = [g.strip() for g in genre_elem.text.split(',')]
            
            # Description
            desc_elem = item.find_all('p', class_='text-muted')
            description = ''
            if len(desc_elem) > 1:
                description = desc_elem[1].text.strip()
            
            # Poster
            poster_elem = item.find('img', class_='loadlate')
            poster_url = None
            if poster_elem:
                poster_url = poster_elem.get('loadlate') or poster_elem.get('src')
            
            return {
                'imdb_id': imdb_id,
                'title': title,
                'year': year,
                'rating': rating,
                'runtime': runtime,
                'genres': genres,
                'description': description,
                'poster_url': poster_url,
                'imdb_url': f"{self.base_url}/title/{imdb_id}/" if imdb_id else None,
            }
        except Exception as e:
            print(f"Error extracting movie data: {e}")
            return None
    
    def _extract_detailed_movie_data(self, soup: BeautifulSoup, imdb_id: str) -> Dict:
        """
        Extract detailed movie data from a movie page
        """
        data = {'imdb_id': imdb_id}
        
        # Title
        title_elem = soup.find('h1', {'data-testid': 'hero-title-block__title'})
        if title_elem:
            data['title'] = title_elem.text.strip()
        
        # Year
        year_elem = soup.find('span', class_='sc-8c396aa2-2')
        if not year_elem:
            year_elem = soup.find('a', href=re.compile(r'/releaseinfo'))
        if year_elem:
            year_text = year_elem.text.strip()
            year_match = re.search(r'(\d{4})', year_text)
            if year_match:
                data['year'] = int(year_match.group(1))
        
        # Rating
        rating_elem = soup.find('span', {'data-testid': 'ratingGroup--imdb-rating'})
        if rating_elem:
            rating_text = rating_elem.text.strip()
            rating_match = re.search(r'(\d+\.\d+)', rating_text)
            if rating_match:
                data['rating'] = float(rating_match.group(1))
        
        # Runtime
        runtime_elem = soup.find('li', {'data-testid': 'title-techspec_runtime'})
        if runtime_elem:
            runtime_text = runtime_elem.find('div').text if runtime_elem.find('div') else ''
            runtime_match = re.search(r'(\d+)', runtime_text)
            if runtime_match:
                data['runtime'] = int(runtime_match.group(1))
        
        # Genres
        genre_elems = soup.find_all('a', href=re.compile(r'/genre/'))
        data['genres'] = [g.text.strip() for g in genre_elems]
        
        # Description
        desc_elem = soup.find('span', {'data-testid': 'plot-xl'})
        if not desc_elem:
            desc_elem = soup.find('span', {'data-testid': 'plot-l'})
        if desc_elem:
            data['description'] = desc_elem.text.strip()
        
        # Poster
        poster_elem = soup.find('img', {'data-testid': 'hero-poster-img'})
        if poster_elem:
            data['poster_url'] = poster_elem.get('src')
        
        return data
    
    def get_popular_nepali_movies(self, limit: int = 50) -> List[Dict]:
        """
        Get popular Nepali movies by searching with multiple strategies
        """
        print("Starting Nepali IMDB crawler...")
        
        # Strategy 1: Search by country
        movies = self.search_nepali_movies("Nepal", limit)
        
        # Strategy 2: Search by keywords
        keywords = ["Nepali", "Kathmandu", "Nepal movie"]
        keyword_movies = self.search_by_keywords(keywords, max_per_keyword=20)
        
        # Combine and deduplicate
        all_movies = {}
        for movie in movies + keyword_movies:
            imdb_id = movie.get('imdb_id')
            if imdb_id and imdb_id not in all_movies:
                all_movies[imdb_id] = movie
        
        # Sort by rating (highest first)
        sorted_movies = sorted(
            all_movies.values(),
            key=lambda x: x.get('rating', 0) or 0,
            reverse=True
        )
        
        return sorted_movies[:limit]


def main():
    """Main function to run the crawler"""
    crawler = NepaliIMDBCrawler()
    
    print("Crawling Nepali movies from IMDB...")
    movies = crawler.get_popular_nepali_movies(limit=50)
    
    print(f"\nFound {len(movies)} Nepali movies!")
    print("\nTop 10 movies:")
    for i, movie in enumerate(movies[:10], 1):
        print(f"{i}. {movie.get('title')} ({movie.get('year')}) - Rating: {movie.get('rating', 'N/A')}")
    
    # Save to JSON
    output_file = 'nepali_movies_imdb.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved {len(movies)} movies to {output_file}")


if __name__ == "__main__":
    main()




