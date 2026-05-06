/**
 * DocumentUpload — Reusable document upload widget.
 *
 * Usage:
 *   <DocumentUpload
 *     documentType="degree"
 *     label="Degree Certificate"
 *     currentUrl={documents.degree}
 *     multi={false}
 *     accept=".pdf,.jpg,.jpeg,.png,.webp"
 *     onUploadSuccess={(result) => { ... }}
 *   />
 *
 * Props:
 *   documentType   string   Required. e.g. 'degree', 'certifications', 'schoolId'
 *   label          string   Display label
 *   currentUrl     string|string[]  Existing URL(s) from getMyDocuments
 *   multi          bool     If true, allows selecting multiple files (certifications)
 *   accept         string   Input accept attribute
 *   onUploadSuccess fn      Called with the API response on success
 *   disabled       bool     Disables interaction
 */

import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Clock, Loader2, ExternalLink, File } from 'lucide-react';
import { uploadService } from '../../services/uploadService';

const STATUS_STYLE = {
  unsubmitted: null,
  pending:     { label: 'Verification Pending', icon: Clock,         color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved:    { label: 'Verified',             icon: CheckCircle,   color: 'bg-green-50 text-green-700 border-green-200' },
  rejected:    { label: 'Rejected',             icon: XCircle,       color: 'bg-red-50 text-red-600 border-red-200' },
};

export default function DocumentUpload({
  documentType,
  label,
  currentUrl,
  multi        = false,
  accept       = '.pdf,.jpg,.jpeg,.png,.webp',
  onUploadSuccess,
  verificationStatus,
  verificationNote,
  disabled     = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [localUrls, setLocalUrls] = useState(
    currentUrl
      ? (Array.isArray(currentUrl) ? currentUrl : [currentUrl])
      : []
  );
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const hasFiles  = localUrls.length > 0;
  const statusCfg = STATUS_STYLE[verificationStatus] || null;

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = multi ? Array.from(files) : [files[0]];

    // Client-side size check (5 MB)
    for (const f of fileList) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`"${f.name}" exceeds the 5 MB limit.`);
        return;
      }
    }

    setError('');
    setUploading(true);
    try {
      const result = await uploadService.uploadDocument(
        multi ? fileList : fileList[0],
        documentType
      );
      const newUrls = result.urls || (result.url ? [result.url] : []);
      if (multi) {
        setLocalUrls(prev => [...prev, ...newUrls].slice(-5));
      } else {
        setLocalUrls(newUrls);
      }
      onUploadSuccess?.(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onFileChange = (e) => handleFiles(e.target.files);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">
          {label}
        </label>
        {statusCfg && (() => {
          const Icon = statusCfg.icon;
          return (
            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
              <Icon className="w-2.5 h-2.5" /> {statusCfg.label}
            </span>
          );
        })()}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2
          border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-all
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'}
          ${disabled || uploading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multi}
          className="hidden"
          onChange={onFileChange}
          disabled={disabled || uploading}
        />
        {uploading ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-xs font-bold text-blue-600">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 text-gray-300" />
            <p className="text-[11px] font-bold text-gray-400">
              {multi ? 'Drop files or click to browse' : 'Drop file or click to browse'}
            </p>
            <p className="text-[10px] text-gray-300 font-medium">PDF, JPG, PNG, WebP · Max 5 MB{multi ? ' · Up to 5 files' : ''}</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
          <XCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}

      {/* Uploaded files */}
      {hasFiles && (
        <div className="space-y-1.5">
          {localUrls.map((url, i) => {
            const filename = url.split('/').pop()?.split('?')[0] || `file_${i + 1}`;
            const isPdf    = url.toLowerCase().includes('.pdf') || url.includes('application/pdf');
            return (
              <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <File className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-[11px] font-bold text-green-700 flex-1 truncate">
                  {isPdf ? 'Document uploaded' : filename}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] font-black text-green-600 hover:text-green-800 flex items-center gap-0.5"
                >
                  View <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection note */}
      {verificationStatus === 'rejected' && verificationNote && (
        <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="font-black">Reason: </span>{verificationNote}
        </p>
      )}
    </div>
  );
}
