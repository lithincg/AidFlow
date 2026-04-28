import { useState, useRef, useEffect } from 'react';
import { imageToBase64 } from '../../utils/imageToBase64';
import { compressImage } from '../../utils/compressImage';
import { extractAndClassifyFromImage } from '../../services/gemini';
import LoadingSpinner from '../common/LoadingSpinner';
import OCRReviewCard from './OCRReviewCard';

export default function OCRUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Clean up blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    // Revoke previous blob URL before creating a new one
    if (preview) URL.revokeObjectURL(preview);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleReadReport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      // Compress if needed
      const compressed = await compressImage(file);
      // Convert to base64
      const { base64, mimeType } = await imageToBase64(compressed);
      // Send to Gemini Vision
      const extracted = await extractAndClassifyFromImage(base64, mimeType);

      if (extracted.error) {
        setError(extracted.error);
        return;
      }

      setResult(extracted);
    } catch (err) {
      console.error('OCR error:', err);
      setError(err.message || 'Failed to read the image');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmed = () => {
    handleReset();
  };

  // If we have a result, show the review card
  if (result) {
    return (
      <OCRReviewCard
        data={result}
        imageUrl={preview}
        onConfirm={handleConfirmed}
        onRetry={handleReset}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-text-primary mb-1">Scan Field Report</h2>
        <p className="text-xs text-text-secondary">
          Upload a photo of a handwritten or printed field report for AI extraction.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`dropzone ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="w-full">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-xl object-contain mb-4"
            />
            <p className="text-xs text-text-muted text-center">
              Click to change image
            </p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
              <span className="text-xl">📸</span>
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">
              Drop a field report photo here
            </p>
            <p className="text-xs text-text-secondary">
              or click to browse / take a photo
            </p>
            <p className="text-[10px] text-text-muted mt-2">
              Supports: handwritten notes, printed forms, WhatsApp screenshots
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-sm text-urgent-high">
          {error}
        </div>
      )}

      {loading && (
        <LoadingSpinner text="Reading your field report..." />
      )}

      {file && !loading && (
        <div className="flex gap-3">
          <button
            className="btn-primary flex-1 py-3"
            onClick={handleReadReport}
          >
            Read Field Report
          </button>
          <button className="btn-secondary" onClick={handleReset}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
