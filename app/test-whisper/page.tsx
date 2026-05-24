'use client';

import { useState } from 'react';

export default function TestWhisperPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUploadAndTranscribe = async () => {
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // First upload the video
      const uploadFormData = new FormData();
      uploadFormData.append('video', selectedFile);

      const uploadResponse = await fetch('/api/video-analysis/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload result:', uploadResult);

      setUploading(false);
      setTranscribing(true);

      // Then transcribe the video
      const transcribeResponse = await fetch('/api/video-analysis/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId: uploadResult.data.uploadId }),
      });

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcriptionResult = await transcribeResponse.json();
      console.log('Transcription result:', transcriptionResult);
      
      setResult(transcriptionResult);
      setTranscribing(false);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setUploading(false);
      setTranscribing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Local Whisper Transcription</h1>
      <p className="text-gray-600 mb-4">
        This page tests the local Whisper transcription system that matches Django's implementation exactly.
      </p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload & Transcribe Video</h2>
        
        <div className="mb-4">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={handleUploadAndTranscribe}
          disabled={!selectedFile || uploading || transcribing}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : transcribing ? 'Transcribing with Local Whisper...' : 'Upload & Transcribe'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Transcription Results</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Method Used:</h3>
              <p className="text-green-600 font-medium">
                {result.data?.transcriptionMethod || 'local-whisper'} 
                (Matching Django Implementation)
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Duration:</h3>
              <p>{result.data?.duration} seconds</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Language:</h3>
              <p>{result.data?.language}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Word Count:</h3>
              <p>{result.data?.wordCount} words</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Full Transcript:</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                <p className="whitespace-pre-wrap">{result.data?.transcript}</p>
              </div>
            </div>

            {result.data?.segments && result.data.segments.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700">Segments ({result.data.segments.length}):</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto space-y-2">
                  {result.data.segments.map((segment: any, index: number) => (
                    <div key={index} className="border-b border-gray-200 pb-2">
                      <p className="text-sm text-gray-600">
                        {segment.start}s - {segment.end}s
                      </p>
                      <p>{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.data?.words && result.data.words.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700">
                  Word-Level Timestamps ({result.data.words.length} words):
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {result.data.words.slice(0, 50).map((word: any, index: number) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 px-2 py-1 rounded text-sm"
                        title={`${word.start}s-${word.end}s (confidence: ${word.confidence})`}
                      >
                        {word.word}
                      </span>
                    ))}
                    {result.data.words.length > 50 && (
                      <span className="text-gray-500">... and {result.data.words.length - 50} more words</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
