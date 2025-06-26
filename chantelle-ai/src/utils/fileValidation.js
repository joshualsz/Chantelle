// src/utils/fileValidation.js
export const FILE_TYPES = {
    PDF: 'application/pdf',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    DOC: 'application/msword',
    TXT: 'text/plain'
  };
  
  export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  
  export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
  
  export const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size (${formatFileSize(file.size)}) exceeds the 10MB limit`);
    }
    
    // Check file type
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = Object.values(FILE_TYPES).includes(file.type);
    
    if (!hasValidExtension && !hasValidMimeType) {
      errors.push('File type not supported. Please upload PDF, DOC, DOCX, or TXT files only');
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push('File appears to be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  export const getFileType = (file) => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf') || file.type === FILE_TYPES.PDF) {
      return 'PDF';
    } else if (fileName.endsWith('.docx') || file.type === FILE_TYPES.DOCX) {
      return 'Word Document (DOCX)';
    } else if (fileName.endsWith('.doc') || file.type === FILE_TYPES.DOC) {
      return 'Word Document (DOC)';
    } else if (fileName.endsWith('.txt') || file.type === FILE_TYPES.TXT) {
      return 'Text File';
    }
    
    return 'Unknown';
  };
  
  export const isTextExtractable = (file) => {
    const fileName = file.name.toLowerCase();
    
    // Text files are always extractable
    if (fileName.endsWith('.txt')) {
      return true;
    }
    
    // DOC/DOCX can usually be extracted
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return true;
    }
    
    // PDFs might be extractable, depending on if they're text-based
    if (fileName.endsWith('.pdf')) {
      return 'maybe'; // We'll need to try extraction to know for sure
    }
    
    return false;
  };