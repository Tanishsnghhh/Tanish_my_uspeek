#!/usr/bin/env python3

from app.text_analyzer import TextAnalyzer
import json

# Test the emotion analysis fix
analyzer = TextAnalyzer()

print("Testing emotion analysis fix...")
print("=" * 50)

# Test 1: Neutral-only keywords
print("\nTest 1: Neutral keywords only")
result1 = analyzer.analyze_transcript('This is the usual practice')
emotion_data = result1['emotion_analysis']
print(f"Dominant emotion: {emotion_data['dominant_emotion']}")
print(f"Confidence: {emotion_data['confidence']}%")
print(f"Emotion scores: {emotion_data['emotion_scores']}")

# Test 2: Actual emotional keywords
print("\nTest 2: Emotional keywords")
result2 = analyzer.analyze_transcript('I am so happy and excited about this amazing news!')
emotion_data2 = result2['emotion_analysis']
print(f"Dominant emotion: {emotion_data2['dominant_emotion']}")
print(f"Confidence: {emotion_data2['confidence']}%")
print(f"Emotion scores: {emotion_data2['emotion_scores']}")

print("\n" + "=" * 50)
print("Test completed!")
