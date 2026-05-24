#!/usr/bin/env python3
"""
Test script for confidence analysis functionality
"""

import sys
import os
import json

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.text_analyzer import TextAnalyzer

def test_confidence_analysis():
    print("🔍 Testing Confidence Analysis...")
    
    # Initialize analyzer
    analyzer = TextAnalyzer()
    
    # Test with confident text
    confident_text = """
    I am absolutely confident that this approach will definitely work. 
    I believe we can achieve excellent results through this method. 
    The research clearly shows that this strategy is effective. 
    I am certain that we will succeed with this plan.
    """
    
    print("\n📝 Test Text (Confident):")
    print(confident_text.strip())
    
    # Analyze
    analysis = analyzer.analyze_transcript(confident_text)
    confidence_data = analysis.get('confidence_analysis', {})
    
    print("\n🎯 CONFIDENCE ANALYSIS RESULTS:")
    print(json.dumps(confidence_data, indent=2))
    
    # Test with uncertain text
    uncertain_text = """
    Um, I think maybe this might work. I guess we could try this approach. 
    Uh, sort of like, you know, it might be okay. I'm not really sure if this will work.
    Perhaps we should consider this option, but I don't know for certain.
    """
    
    print("\n📝 Test Text (Uncertain):")
    print(uncertain_text.strip())
    
    # Analyze uncertain text
    analysis2 = analyzer.analyze_transcript(uncertain_text)
    confidence_data2 = analysis2.get('confidence_analysis', {})
    
    print("\n🎯 CONFIDENCE ANALYSIS RESULTS (Uncertain):")
    print(json.dumps(confidence_data2, indent=2))
    
    print("\n✅ Confidence analysis test completed!")

if __name__ == "__main__":
    test_confidence_analysis()
