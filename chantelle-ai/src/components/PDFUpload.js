// src/components/PDFUpload.js
import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

const PDFUpload = ({ onTextExtracted, currentText, onTextChange }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadError, setUploadError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Extract text from PDF using basic method (you can enhance this)
  const extractPDFText = async (file) => {
    try {
      // For now, we'll just read as text and return
      // In a real implementation, you'd use pdf-parse or similar
      const text = await file.text();
      return text || 'Could not extract text from PDF. Please copy and paste your resume content manually.';
    } catch (error) {
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  };

  // Extract text from DOC/DOCX (basic implementation)
  const extractDocText = async (file) => {
    try {
      // Basic text extraction - in production, use mammoth.js properly
      const text = await file.text();
      return text || 'Could not extract text from document. Please copy and paste your resume content manually.';
    } catch (error) {
      throw new Error('Failed to extract text from document: ' + error.message);
    }
  };

  // Handle file processing
  const processFile = async (file) => {
    setUploadStatus('uploading');
    setUploadError('');
    setFileName(file.name);

    try {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      let extractedText = '';
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        extractedText = await extractPDFText(file);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword' ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.doc')
      ) {
        extractedText = await extractDocText(file);
      } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        extractedText = await file.text();
      } else {
        throw new Error('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.');
      }

      if (!extractedText || extractedText.length < 20) {
        throw new Error('Could not extract meaningful text from the file. Please try a different file or paste your resume content manually.');
      }

      onTextExtracted(extractedText);
      setUploadStatus('success');
    } catch (error) {
      setUploadError(error.message);
      setUploadStatus('error');
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Clear uploaded file
  const clearFile = () => {
    setUploadStatus('idle');
    setUploadError('');
    setFileName('');
    onTextExtracted('');
  };

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-400 bg-purple-50'
            : uploadStatus === 'success'
            ? 'border-green-300 bg-green-50'
            : uploadStatus === 'error'
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-purple-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadStatus === 'uploading'}
        />

        {uploadStatus === 'uploading' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
            <p className="text-purple-600 font-medium">Processing {fileName}...</p>
            <p className="text-sm text-gray-500">Extracting text from your resume</p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="text-green-600 mb-3" size={32} />
            <p className="text-green-700 font-medium">Successfully uploaded {fileName}</p>
            <p className="text-sm text-gray-600">Text extracted and ready for optimization</p>
            <button
              onClick={clearFile}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Upload a different file
            </button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="text-red-600 mb-3" size={32} />
            <p className="text-red-700 font-medium">Upload failed</p>
            <p className="text-sm text-red-600 mb-3">{uploadError}</p>
            <button
              onClick={() => setUploadStatus('idle')}
              className="text-sm text-purple-600 hover:text-purple-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {uploadStatus === 'idle' && (
          <div className="flex flex-col items-center">
            <Upload className="text-gray-400 mb-3" size={32} />
            <p className="text-gray-600 font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-400">
              PDF, DOC, DOCX, or TXT up to 5MB
            </p>
          </div>
        )}
      </div>

      {/* Manual Text Input */}
      <div className="text-center text-gray-500 text-sm">or</div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Paste your resume content manually
        </label>
        <textarea
          value={currentText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste your resume content here..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Text Preview */}
      {currentText && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Resume Preview ({currentText.length} characters)
            </span>
            <button
              onClick={clearFile}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
            {currentText.substring(0, 300)}
            {currentText.length > 300 && '...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFUpload;