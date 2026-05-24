#!/usr/bin/env python3
"""
Fixed Word Power Analysis Test
Tests the word power analysis with properly sized text chunks
"""

import sys
import os
import json
import traceback
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.text_analyzer import TextAnalyzer
    print("✅ Successfully imported TextAnalyzer")
except ImportError as e:
    print(f"❌ Failed to import TextAnalyzer: {e}")
    sys.exit(1)

def create_short_test_text():
    """Create a shorter test text that won't exceed token limits"""
    text = """
Good morning everyone. Today I want to discuss an important topic that affects all of us in our daily lives. 
Communication is essential for building strong relationships and achieving success in both personal and professional settings.

When we speak clearly and confidently, we can express our ideas more effectively. This helps us connect with others and 
share our thoughts in meaningful ways. However, many people struggle with public speaking and effective communication.

The key to improving communication skills is practice and dedication. We should focus on expanding our vocabulary, 
reducing filler words like "um" and "uh", and speaking with proper pace and clarity. Good speakers also use varied 
sentence structures and avoid repetitive language patterns.

Research shows that confident speakers are more likely to succeed in their careers. They can influence others, 
lead teams effectively, and present ideas persuasively. These skills are valuable in today's competitive environment.

Furthermore, effective communication involves active listening. We must pay attention to others and respond appropriately. 
This creates better understanding and stronger connections between people.

In conclusion, developing strong communication skills requires continuous effort and practice. By focusing on vocabulary, 
clarity, and confidence, anyone can become a more effective speaker and communicator.
"""
    return text.strip()

def main():
    print("🚀 FIXED WORD POWER ANALYSIS TEST")
    print("=" * 60)
    
    # Create test text
    test_text = create_short_test_text()
    print(f"✅ Generated test text with {len(test_text)} characters")
    print(f"📊 Word count: {len(test_text.split())}")
    
    try:
        # Initialize analyzer
        print("\n🔍 Initializing TextAnalyzer...")
        analyzer = TextAnalyzer()
        
        # Run analysis
        print("🎯 Running word power analysis...")
        result = analyzer.analyze_transcript(test_text)
        
        print("\n📊 ANALYSIS RESULTS")
        print("-" * 40)
        
        # Print main results
        if result and 'content_assessment' in result:
            ca = result['content_assessment']
            print(f"Word Power Score: {ca.get('word_power_score', 'N/A')}/5")
            print(f"Word Power Percentage: {ca.get('word_power_percentage', 'N/A')}/100")
            print(f"Quality Score: {ca.get('quality_score', 'N/A')}")
            print(f"Vocabulary Score: {ca.get('vocabulary_score', 'N/A')}")
            print(f"Fluency Score: {ca.get('fluency_score', 'N/A')}")
            print(f"Overall Strength: {ca.get('overall_strength', 'N/A')}")
            print(f"Strength Level: {ca.get('strength_level', 'N/A')}")
            
            # Print strengths and improvements
            if 'strengths_improvements' in result:
                si = result['strengths_improvements']
                print(f"\n✅ STRENGTHS:")
                if 'strengths' in si and si['strengths']:
                    for strength in si['strengths']:
                        print(f"  • {strength.get('area', 'Unknown')}: {strength.get('description', 'N/A')}")
                
                print(f"\n⚠️ IMPROVEMENTS:")
                if 'improvements' in si and si['improvements']:
                    for improvement in si['improvements']:
                        print(f"  • {improvement.get('area', 'Unknown')}: {improvement.get('description', 'N/A')}")
            
            # Save results
            with open('word_power_test_results.json', 'w') as f:
                json.dump(result, f, indent=2)
            print(f"\n💾 Results saved to: word_power_test_results.json")
            
        else:
            print("❌ No analysis results returned")
            
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        traceback.print_exc()
        return False
    
    print("\n🏁 Analysis complete!")
    return True

if __name__ == "__main__":
    main()
