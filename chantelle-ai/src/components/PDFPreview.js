// src/components/PDFPreview.js - Optional component for PDF preview
import React, { useState, useEffect } from 'react';
import { Eye, Download, X } from 'lucide-react';

const PDFPreview = ({ file, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  if (!file || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">PDF Preview: {file.name}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = file.name;
                link.click();
              }}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <X size={16} />
              <span>Close</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <iframe
            src={pdfUrl}
            className="w-full h-full border rounded"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;