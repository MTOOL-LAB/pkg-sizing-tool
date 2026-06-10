
export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string | null;
  isSelected: boolean;
  status: 'pending' | 'processing' | 'success' | 'error';
  error: string | null;
}
