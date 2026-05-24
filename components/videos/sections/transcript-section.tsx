'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TranscriptSectionProps {
  analysisData: any;
}

export default function TranscriptSection({ analysisData }: TranscriptSectionProps) {
  const renderDiffText = (originalText: string, correctedText: string) => {
    if (!originalText || !correctedText) return null;

    const originalWords = originalText.split(' ');
    const correctedWords = correctedText.split(' ');
    const result = [];
    
    let i = 0, j = 0;
    while (i < originalWords.length && j < correctedWords.length) {
      if (originalWords[i] === correctedWords[j]) {
        result.push(<span key={`${i}-${j}`} className="text-gray-800">{originalWords[i]} </span>);
        i++;
        j++;
      } else {
        // Find next matching word
        let nextMatch = -1;
        for (let k = j + 1; k < correctedWords.length; k++) {
          if (originalWords[i] === correctedWords[k]) {
            nextMatch = k;
            break;
          }
        }
        
        if (nextMatch !== -1) {
          // Add corrected words before the match
          for (let k = j; k < nextMatch; k++) {
            result.push(<span key={`corrected-${k}`} className="bg-green-200 text-green-800 px-1 rounded">{correctedWords[k]} </span>);
          }
          j = nextMatch;
        } else {
          // Word was changed/corrected
          result.push(<span key={`original-${i}`} className="bg-red-200 text-red-800 px-1 rounded line-through">{originalWords[i]} </span>);
          result.push(<span key={`corrected-${j}`} className="bg-green-200 text-green-800 px-1 rounded">{correctedWords[j]} </span>);
          i++;
          j++;
        }
      }
    }
    
    // Add remaining words
    while (j < correctedWords.length) {
      result.push(<span key={`remaining-${j}`} className="bg-green-200 text-green-800 px-1 rounded">{correctedWords[j]} </span>);
      j++;
    }
    
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Original Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            📄 Original Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <p className="text-gray-800 leading-relaxed">
              {analysisData?.transcript || "No transcript available."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grammar Corrected Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            📝 Grammar Corrected
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              AI Generated
            </span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Text in red shows grammar corrections
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            {analysisData?.transcript && analysisData?.corrected_transcript ? (
              <div className="text-gray-800 leading-relaxed">
                {renderDiffText(analysisData.transcript, analysisData.corrected_transcript)}
              </div>
            ) : (
              <p className="text-gray-800 leading-relaxed">
                {analysisData?.corrected_transcript || "N/A"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Repeated Words Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            🔄 Repeated Words Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisData?.repeated_words && analysisData.repeated_words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisData.repeated_words.map((item: any, index: number) => (
                <div key={index} className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-orange-800">"{item.word}"</span>
                    <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-sm font-semibold">
                      {item.count}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No repeated words detected.</p>
          )}
        </CardContent>
      </Card>

      {/* Filler Words Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            🎯 Filler Words Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisData?.filler_words && analysisData.filler_words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisData.filler_words.map((item: any, index: number) => (
                <div key={index} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-yellow-800">"{item.word}"</span>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-sm font-semibold">
                      {item.count}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No filler words detected.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
