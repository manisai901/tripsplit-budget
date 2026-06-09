/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Optimized PDF Receipt Handler
 * Handles uploading, fetching, caching, and displaying PDFs efficiently
 * Prevents hanging and memory leaks
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// In-memory cache for PDF blobs to prevent re-downloads
const pdfCache = new Map<string, { blob: Blob; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Compress PDF file if it exceeds size limit
 * Most PDFs are already optimized, so we just validate
 */
export async function compressPdf(file: File): Promise<File> {
  if (file.type !== 'application/pdf') {
    return file;
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
  if (file.size <= MAX_SIZE) {
    return file;
  }

  console.warn(`PDF exceeds ${MAX_SIZE / 1024 / 1024}MB, file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  // Return original - user should reduce file size
  return file;
}

/**
 * Upload PDF to Firebase Storage with metadata
 * @param tripId - Trip identifier
 * @param expenseId - Expense identifier (optional)
 * @param file - PDF file to upload
 * @returns Download URL for the uploaded PDF
 */
export async function uploadPdfReceipt(
  tripId: string,
  expenseId: string | null,
  file: File
): Promise<{ url: string; path: string }> {
  try {
    const compressed = await compressPdf(file);
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const storagePath = expenseId 
      ? `trips/${tripId}/expenses/${expenseId}/receipt_${timestamp}_${randomId}.pdf`
      : `trips/${tripId}/receipts/${timestamp}_${randomId}.pdf`;
    
    const fileRef = ref(storage, storagePath);

    // Upload with metadata for tracking
    const metadata = {
      contentType: 'application/pdf',
      cacheControl: 'public, max-age=31536000', // 1 year
      customMetadata: {
        tripId,
        expenseId: expenseId || 'none',
        uploadedAt: new Date().toISOString(),
        fileSize: String(compressed.size),
        fileName: file.name
      }
    };

    await uploadBytes(fileRef, compressed, metadata);

    // Get download URL
    const downloadUrl = await getDownloadURL(fileRef);
    
    console.log('PDF uploaded successfully:', storagePath);
    return { url: downloadUrl, path: storagePath };
  } catch (error) {
    console.error('PDF upload failed:', error);
    throw new Error('Failed to upload PDF receipt. Please check file size and try again.');
  }
}

/**
 * Fetch PDF from URL with intelligent caching
 * Prevents multiple downloads of same file
 * @param pdfUrl - URL of PDF to fetch
 * @param maxWaitMs - Maximum time to wait (default 30s)
 * @returns Blob of PDF data
 */
export async function fetchAndCachePdf(
  pdfUrl: string,
  maxWaitMs: number = 30000
): Promise<Blob> {
  try {
    // Check cache validity
    const cached = pdfCache.get(pdfUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('PDF loaded from cache');
      return cached.blob;
    }

    console.log('Fetching PDF:', pdfUrl);
    
    // Set up abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, maxWaitMs);

    try {
      const response = await fetch(pdfUrl, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'public, max-age=31536000',
          'Accept': 'application/pdf'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('pdf')) {
        throw new Error('Invalid content type: expected PDF');
      }

      const blob = await response.blob();
      
      // Validate blob size
      if (blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      // Cache the blob
      pdfCache.set(pdfUrl, { blob, timestamp: Date.now() });
      
      console.log('PDF fetched and cached successfully');
      return blob;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`PDF download timeout (${maxWaitMs / 1000}s exceeded). Check your connection.`);
      }
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch PDF:', message);
    throw error;
  }
}

/**
 * Create a blob URL for immediate preview/download
 * Must be revoked after use to prevent memory leaks
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke blob URL to free memory
 * IMPORTANT: Call this when done with preview
 */
export function revokeBlobUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('Failed to revoke blob URL:', error);
  }
}

/**
 * Clear entire PDF cache when needed (e.g., on logout)
 */
export function clearPdfCache(): void {
  console.log('Clearing PDF cache');
  pdfCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getPdfCacheStats(): { size: number; entries: number } {
  return {
    size: Array.from(pdfCache.values()).reduce((sum, item) => sum + item.blob.size, 0),
    entries: pdfCache.size
  };
}
