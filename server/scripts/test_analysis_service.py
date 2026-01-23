import sys
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Setup paths
# current file: server/scripts/test_analysis_service.py
# target root: server/
current_dir = Path(__file__).resolve().parent
server_dir = current_dir.parent
sys.path.append(str(server_dir))

# Load env
env_path = server_dir / ".env"
load_dotenv(env_path)

# Now we can import from app
try:
    from app.services import analysis_service
except ImportError as e:
    print(f"Error importing app modules: {e}")
    sys.exit(1)

def test_analysis_service():
    symbol = "HPG"  # Example symbol
    print(f"--- Starting Analysis Test for {symbol} ---")
    
    try:
        # 1. Test full analysis
        print(f"\n> Calling analysis_service.analyze_stock('{symbol}')...")
        print("> This may take a few seconds as it fetches news, scrapes content, and calls Perplexity AI...")
        
        result = analysis_service.analyze_stock(symbol)
        
        # 2. Print Summary
        print("\n--- Analysis Result ---")
        print(f"Symbol: {result.get('symbol')}")
        print(f"Context: {result.get('market_context')}")
        
        articles = result.get('articles', [])
        print(f"\nAnalyzed {len(articles)} articles.")
        
        for idx, art in enumerate(articles):
            analysis = art.get('analysis')
            title = art.get('title')
            print(f"\n[{idx+1}] {title}")
            if analysis:
                print(f"    Sentiment: {analysis.get('sentiment')}")
                print(f"    Score: {analysis.get('score')}/10")
                print(f"    TLDR: {analysis.get('tldr')}")
            else:
                print("    (Analysis failed or no data)")

        summary = result.get('overall_summary')
        if summary:
            print("\n--- Overall Market Summary ---")
            print(f"Sentiment: {summary.get('market_sentiment')}")
            print(f"Confidence: {summary.get('confidence_score')}/10")
            print(f"Summary: {summary.get('summary')}")
            print(f"Trend: {summary.get('trend_analysis')}")
        else:
            print("\nx No overall summary generated.")
            
        # Optional: dump full JSON to file for inspection
        output_file = current_dir / f"analysis_result_{symbol}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\n> Full JSON result saved to: {output_file}")

    except Exception as e:
        print(f"\n!!! Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_analysis_service()
