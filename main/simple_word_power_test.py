#!/usr/bin/env python3
"""
Word Power Analysis Test Script
Comprehensive testing of the word power analysis process with 8000 characters
"""

import os
import sys
import json
from pathlib import Path

# Add the current directory to sys.path to import local modules
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    from app.text_analyzer import TextAnalyzer
    print("✅ Successfully imported TextAnalyzer")
except ImportError as e:
    print(f"❌ Failed to import TextAnalyzer: {e}")
    sys.exit(1)

def create_test_text_8000_chars():
    """Create a test text with approximately 8000 characters for comprehensive analysis"""
    test_text = """
    Hello everyone, welcome to today's presentation about effective communication and public speaking. 
    I'm extremely excited to share these valuable insights with you all today. Communication is, 
    without a doubt, one of the most important skills we can develop in our personal and professional lives.
    
    First, let me discuss the fundamental principles of effective communication. Clear articulation is 
    absolutely essential for successful communication. When we speak clearly and distinctly, our 
    audience can easily understand our message without confusion or misinterpretation. This involves 
    proper pronunciation, appropriate volume, and strategic pacing throughout our presentation.
    
    Vocabulary diversity plays a crucial role in engaging our audience and demonstrating our expertise 
    on the subject matter. Using varied and sophisticated vocabulary shows intellectual depth and 
    keeps listeners interested and engaged throughout the entire presentation. However, we must 
    balance complexity with accessibility to ensure our message reaches everyone effectively.
    
    Repetition, while sometimes necessary for emphasis, can become problematic when overused. 
    Excessive repetition often indicates lack of preparation or limited vocabulary range. We should 
    strive to express our ideas using different words and phrases to maintain audience interest 
    and demonstrate linguistic competence and versatility in our communication style.
    
    Sentence structure variation is another critical element of powerful communication. Using only 
    simple sentences creates monotonous delivery that fails to engage listeners effectively. Instead, 
    we should incorporate complex sentences, compound structures, and varied lengths to create 
    rhythm and flow that captivates our audience throughout the presentation duration.
    
    Filler words like "um," "uh," "you know," and "like" significantly detract from our message's 
    impact and professional appearance. These verbal crutches often indicate nervousness, lack of 
    preparation, or uncertainty about our content. Eliminating filler words requires conscious 
    practice and awareness of our speaking patterns and habits during presentations.
    
    Emotional intelligence in communication involves understanding and responding appropriately to 
    our audience's reactions and feedback. This includes reading body language, adjusting our tone 
    and pace based on audience engagement, and adapting our message to maintain connection and 
    understanding throughout our presentation time frame.
    
    Positive language creates an encouraging and supportive atmosphere that promotes learning and 
    engagement. Words carry emotional weight and can influence how our audience perceives both 
    our message and us as speakers. Choosing positive, uplifting vocabulary enhances our credibility 
    and makes our presentation more memorable and impactful for everyone present.
    
    Neutral language provides balanced, objective information without bias or emotional manipulation. 
    This approach builds trust and allows audiences to form their own opinions based on facts 
    rather than emotional appeals. Neutral communication is particularly important in professional 
    settings where objectivity and credibility are paramount for success.
    
    However, negative language patterns can undermine our message and create defensive reactions 
    in our audience. Words that criticize, blame, or diminish others reduce our effectiveness and 
    can damage relationships. We must be mindful of our language choices to maintain positive 
    communication dynamics throughout all our interactions and presentations.
    
    Emphasis techniques help highlight important points and create memorable moments in our 
    presentations. Strategic use of volume changes, pauses, and vocal inflection draws attention 
    to key concepts and helps audiences retain critical information long after our presentation 
    ends. These techniques require practice and timing to implement effectively.
    
    Practice and preparation are fundamental to developing strong word power and communication 
    skills. Regular rehearsal helps eliminate filler words, improves vocabulary usage, and builds 
    confidence in our delivery. The more we practice, the more natural and effortless our 
    communication becomes in any professional or personal setting we encounter.
    
    Technology can enhance our communication when used appropriately, but it should never replace 
    the fundamental skills of clear speech, varied vocabulary, and engaging delivery. Visual aids, 
    microphones, and presentation software are tools that support our message, not substitutes 
    for effective communication skills and thorough preparation.
    
    Cultural awareness in communication acknowledges that different audiences may have varying 
    expectations, communication styles, and interpretations of our language choices. Adapting 
    our approach while maintaining our authentic voice demonstrates respect and increases our 
    effectiveness across diverse groups and communities we may encounter.
    
    Feedback and continuous improvement are essential for developing exceptional communication 
    skills. Seeking input from trusted colleagues, recording our presentations for self-evaluation, 
    and remaining open to constructive criticism help us identify areas for growth and refinement 
    in our word power and overall presentation abilities.
    
    In conclusion, effective word power combines clear articulation, diverse vocabulary, minimal 
    repetition, varied sentence structures, and elimination of filler words. These elements work 
    together to create powerful, engaging communication that resonates with audiences and achieves 
    our intended objectives. Thank you for your attention and participation in today's discussion.
    """
    
    # Ensure the text is approximately 8000 characters
    while len(test_text) < 8000:
        test_text += " This additional content helps reach our target length for comprehensive analysis."
    
    return test_text[:8000]  # Trim to exactly 8000 characters

def analyze_word_power_step_by_step(text):
    """Perform detailed step-by-step analysis of word power metrics"""
    print("🔍 STEP-BY-STEP WORD POWER ANALYSIS")
    print("=" * 60)
    
    analyzer = TextAnalyzer()
    
    # Step 1: Basic text metrics
    print("\n📊 STEP 1: Basic Text Metrics")
    print("-" * 30)
    words = text.split()
    sentences = text.split('.')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    print(f"Total characters: {len(text)}")
    print(f"Total words: {len(words)}")
    print(f"Total sentences: {len(sentences)}")
    print(f"Average words per sentence: {len(words) / len(sentences):.2f}")
    print(f"Average characters per word: {len(text.replace(' ', '')) / len(words):.2f}")
    
    # Step 2: Vocabulary analysis
    print("\n📝 STEP 2: Vocabulary Analysis")
    print("-" * 30)
    unique_words = set(word.lower().strip('.,!?";:()[]{}') for word in words)
    vocabulary_diversity = len(unique_words) / len(words)
    
    print(f"Unique words: {len(unique_words)}")
    print(f"Total words: {len(words)}")
    print(f"Vocabulary diversity ratio: {vocabulary_diversity:.4f}")
    print(f"Vocabulary diversity percentage: {vocabulary_diversity * 100:.2f}%")
    
    # Step 3: Repetition analysis
    print("\n🔄 STEP 3: Repetition Analysis")
    print("-" * 30)
    word_counts = {}
    for word in words:
        clean_word = word.lower().strip('.,!?";:()[]{}')
        if len(clean_word) > 3:  # Only count significant words
            word_counts[clean_word] = word_counts.get(clean_word, 0) + 1
    
    repeated_words = {word: count for word, count in word_counts.items() if count > 2}
    repetition_score = len(repeated_words) / len(unique_words) if unique_words else 0
    
    print(f"Words repeated more than 2 times: {len(repeated_words)}")
    print(f"Most repeated words: {sorted(repeated_words.items(), key=lambda x: x[1], reverse=True)[:5]}")
    print(f"Repetition ratio: {repetition_score:.4f}")
    
    # Step 4: Filler words analysis
    print("\n🚫 STEP 4: Filler Words Analysis")
    print("-" * 30)
    filler_words = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so']
    filler_count = 0
    filler_found = []
    
    text_lower = text.lower()
    for filler in filler_words:
        count = text_lower.count(filler)
        if count > 0:
            filler_count += count
            filler_found.append((filler, count))
    
    filler_percentage = (filler_count / len(words)) * 100
    print(f"Total filler words found: {filler_count}")
    print(f"Filler words detected: {filler_found}")
    print(f"Filler words percentage: {filler_percentage:.2f}%")
    
    # Step 5: Sentiment and tone analysis
    print("\n😊 STEP 5: Sentiment Analysis")
    print("-" * 30)
    positive_words = ['excellent', 'good', 'great', 'effective', 'successful', 'valuable', 'important', 'essential', 'powerful', 'engaging']
    negative_words = ['bad', 'poor', 'terrible', 'awful', 'problematic', 'detract', 'fail', 'damage', 'undermine', 'criticize']
    neutral_words = ['provides', 'involves', 'includes', 'demonstrates', 'indicates', 'acknowledges', 'combines', 'contains']
    
    positive_count = sum(text.lower().count(word) for word in positive_words)
    negative_count = sum(text.lower().count(word) for word in negative_words)
    neutral_count = sum(text.lower().count(word) for word in neutral_words)
    
    total_sentiment_words = positive_count + negative_count + neutral_count
    
    print(f"Positive words: {positive_count}")
    print(f"Negative words: {negative_count}")
    print(f"Neutral words: {neutral_count}")
    
    if total_sentiment_words > 0:
        print(f"Positive sentiment: {(positive_count / total_sentiment_words) * 100:.1f}%")
        print(f"Negative sentiment: {(negative_count / total_sentiment_words) * 100:.1f}%")
        print(f"Neutral sentiment: {(neutral_count / total_sentiment_words) * 100:.1f}%")
    
    # Step 6: Full analyzer results
    print("\n🎯 STEP 6: Complete Analysis Results")
    print("-" * 30)
    
    try:
        results = analyzer.analyze_transcript(text)
        
        print(f"Word Power Score: {results.get('word_power_score', 'N/A')}/5")
        print(f"Word Power Percentage: {results.get('word_power_percentage', 'N/A')}/100")
        print(f"Quality Score: {results.get('quality_score', 'N/A')}")
        print(f"Vocabulary Score: {results.get('vocabulary_score', 'N/A')}")
        print(f"Clarity Score: {results.get('clarity_score', 'N/A')}")
        print(f"Fluency Score: {results.get('fluency_score', 'N/A')}")
        print(f"Overall Strength: {results.get('overall_strength', 'N/A')}")
        print(f"Strength Level: {results.get('strength_level', 'N/A')}")
        print(f"Complexity Level: {results.get('complexity_level', 'N/A')}")
        
        return results
        
    except Exception as e:
        print(f"❌ Error in analyzer: {e}")
        return None

def categorize_performance(score, percentage):
    """Categorize word power performance"""
    print("\n📊 PERFORMANCE CATEGORIZATION")
    print("-" * 30)
    
    if percentage >= 80:
        category = "Excellent"
        emoji = "🏆"
        feedback = "Outstanding word power with excellent vocabulary and clarity"
    elif percentage >= 70:
        category = "Good"
        emoji = "💪"
        feedback = "Good word power with room for minor improvements"
    elif percentage >= 60:
        category = "Average"
        emoji = "👍"
        feedback = "Average word power, focus on vocabulary diversity"
    elif percentage >= 50:
        category = "Below Average"
        emoji = "⚠️"
        feedback = "Below average word power, needs significant improvement"
    else:
        category = "Poor"
        emoji = "📉"
        feedback = "Poor word power, requires extensive practice and development"
    
    print(f"Score: {score}/5")
    print(f"Percentage: {percentage}/100")
    print(f"Category: {category} {emoji}")
    print(f"Feedback: {feedback}")
    
    return category, emoji, feedback

def provide_improvement_suggestions(analysis_results):
    """Provide specific improvement suggestions based on analysis"""
    print("\n💡 IMPROVEMENT SUGGESTIONS")
    print("-" * 30)
    
    suggestions = []
    
    # Vocabulary suggestions
    vocab_score = analysis_results.get('vocabulary_score', 0)
    if vocab_score < 70:
        suggestions.append("📚 Expand vocabulary by reading more and using synonyms")
        suggestions.append("🎯 Practice using more sophisticated words in daily speech")
    
    # Repetition suggestions
    if analysis_results.get('word_power_score', 0) < 4:
        suggestions.append("🔄 Reduce word repetition by using varied expressions")
        suggestions.append("📝 Practice paraphrasing to express ideas differently")
    
    # Fluency suggestions
    fluency_score = analysis_results.get('fluency_score', 0)
    if fluency_score < 70:
        suggestions.append("🗣️ Practice speaking slowly and deliberately")
        suggestions.append("⏸️ Use strategic pauses instead of filler words")
    
    # Clarity suggestions
    clarity_score = analysis_results.get('clarity_score', 0)
    if clarity_score < 70:
        suggestions.append("🎤 Focus on clear articulation and pronunciation")
        suggestions.append("📏 Vary sentence length for better rhythm")
    
    if not suggestions:
        suggestions.append("🌟 Excellent performance! Continue practicing to maintain high standards")
    
    for i, suggestion in enumerate(suggestions, 1):
        print(f"{i}. {suggestion}")

def main():
    """Main function to run the complete word power analysis"""
    print("🚀 WORD POWER ANALYSIS - COMPREHENSIVE TEST")
    print("=" * 60)
    print("Testing with 8000 characters of content")
    print("Analyzing all aspects of word power metrics")
    print("=" * 60)
    
    # Create test text
    test_text = create_test_text_8000_chars()
    print(f"\n✅ Generated test text with {len(test_text)} characters")
    
    # Perform step-by-step analysis
    analysis_results = analyze_word_power_step_by_step(test_text)
    
    if analysis_results:
        # Categorize performance
        score = analysis_results.get('word_power_score', 0)
        percentage = analysis_results.get('word_power_percentage', 0)
        category, emoji, feedback = categorize_performance(score, percentage)
        
        # Provide improvement suggestions
        provide_improvement_suggestions(analysis_results)
        
        # Final summary
        print("\n🎯 FINAL SUMMARY")
        print("-" * 30)
        print(f"Word Power Rating: {score}/5 {emoji}")
        print(f"Percentage Score: {percentage}/100")
        print(f"Performance Level: {category}")
        print(f"Overall Assessment: {feedback}")
        
        # Export results
        export_data = {
            "test_metadata": {
                "text_length": len(test_text),
                "analysis_type": "comprehensive_word_power",
                "timestamp": "2025-09-02"
            },
            "results": analysis_results,
            "performance": {
                "category": category,
                "emoji": emoji,
                "feedback": feedback
            }
        }
        
        # Save results to file
        output_file = "word_power_analysis_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Results saved to: {output_file}")
        
    else:
        print("\n❌ Analysis failed. Please check the TextAnalyzer implementation.")
    
    print("\n🏁 Analysis complete!")

if __name__ == "__main__":
    main()
