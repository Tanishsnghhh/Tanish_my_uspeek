#!/usr/bin/env python3

"""
Targeted tests for emotion analysis, focusing on the Neutral 100% scenario when only
neutral-category keywords (e.g., 'usual', 'ordinary') occur in the text.
"""

from typing import Dict
from app.text_analyzer import EmotionAnalyzer, TextAnalyzer


def normalize(scores: Dict[str, int]) -> Dict[str, float]:
    total = sum(scores.values())
    if total == 0:
        return {k: 0.0 for k in scores}
    return {k: (v / total) * 100.0 for k, v in scores.items()}


def print_case(title: str, text: str):
    print("\n===")
    print(title)
    print("Text:", text)

    ea = EmotionAnalyzer().analyze_emotions(text)
    ta = TextAnalyzer()._analyze_emotions(text)  # using same logic via TextAnalyzer

    for label, result in (("EmotionAnalyzer", ea), ("TextAnalyzer", ta)):
        perc = normalize(result["emotion_scores"]) if isinstance(result.get("emotion_scores"), dict) else {}
        print(f"\n[{label}] Dominant: {result['dominant_emotion']} {result['emoji']}")
        print(f"[{label}] Confidence: {result['confidence']}%")
        print(f"[{label}] Detected Keywords (first 5): {result.get('detected_keywords', [])[:5]}")
        print(f"[{label}] Emotion Scores (raw): {result.get('emotion_scores', {})}")
        print(f"[{label}] Emotion Scores (normalized %): {{" + ", ".join(f"{k}: {v:.0f}%" for k, v in perc.items()) + "}}")


def run_tests():
    # Case 1: Only neutral-ish words present
    print_case(
        "Case 1: Neutral-only keywords (expect Neutral dominant; current logic gives 100% Neutral)",
        "This is usual and ordinary content about regular topics."
    )

    # Case 2: Mixed neutral + positive
    print_case(
        "Case 2: Mixed neutral + positive (expect Joy/Happiness to dominate)",
        "It's a usual day but I'm happy and excited about the awesome results!"
    )

    # Case 3: Mixed fear + sadness
    print_case(
        "Case 3: Negative emotions (Fear/Sadness)",
        "I'm worried and anxious, honestly a bit sad about the situation."
    )

    # Case 4: No emotion keywords
    print_case(
        "Case 4: No emotion keywords (expect Neutral fallback with low confidence)",
        "Mathematics involves algebra and calculus with various theorems."
    )

    print("\nNOTE:\n- The analyzer is keyword-based. If only Neutral-category words (e.g., 'usual', 'ordinary')\n  are matched, Neutral becomes 100% by design. If this is not desired, consider:\n  • Treating Neutral as a fallback only (do not count its keywords in scoring).\n  • Down-weighting Neutral keywords (e.g., 0.25x) so emotional categories can dominate.\n  • Using a transformer-based emotion classifier for richer signals.\n")


if __name__ == "__main__":
    run_tests()
