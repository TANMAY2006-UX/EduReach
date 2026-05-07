import { useState } from 'react';
import { FileText, CheckCircle, Clock, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import DocumentUpload from './DocumentUpload';

export default function VerificationStatusRow({
  label,
  documentType,
  url,
  status,
  onUploadSuccess
}) {
  const [isReuploading, setIsReuploading] = useState(false);

  let fileName = 'No file uploaded';

  if (typeof url === 'string' && url) {
    fileName = url.split('/').pop().split('?')[0];
  } else if (Array.isArray(url) && url.length > 0) {
    fileName = url[0].split('/').pop().split('?')[0]; // show first file
  }

  const badgeConfig = {
    approved: { icon: CheckCircle, label: 'Verified', color: 'bg-green-50 text-green-700 border-green-200' },
    pending: { icon: Clock, label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    rejected: { icon: XCircle, label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200' },
    unsubmitted: { icon: Clock, label: 'Missing', color: 'bg-gray-50 text-gray-500 border-gray-200' },
  };

  const currentStatus = badgeConfig[status] || badgeConfig.unsubmitted;
  const BadgeIcon = currentStatus.icon;

  const hasFile =
    (typeof url === 'string' && url) ||
    (Array.isArray(url) && url.length > 0);

  const fileUrl = Array.isArray(url) ? url[0] : url;
  if (isReuploading) {
    return (
      <div className="mt-2 p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
        <DocumentUpload
          documentType={documentType}
          label={label}
          currentUrl={url}
          multi={false}
          verificationStatus={status}
          onUploadSuccess={(res) => {
            setIsReuploading(false);
            if (onUploadSuccess) onUploadSuccess(res);
          }}
        />
        <button
          onClick={() => setIsReuploading(false)}
          className="mt-3 text-xs font-bold text-gray-500 hover:text-gray-700 underline"
        >
          Cancel Re-upload
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-colors bg-white">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-gray-50 border-2 border-gray-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black text-gray-900 uppercase tracking-wide truncate">{label}</p>
          <p className="text-[10px] font-bold text-gray-400 truncate">{fileName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 pl-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${currentStatus.color}`}>
          <BadgeIcon className="w-2.5 h-2.5" /> {currentStatus.label}
        </span>

        {status === 'rejected' && (
          <button
            onClick={() => setIsReuploading(true)}
            className="flex items-center gap-1 text-[10px] font-black text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Re-upload <RefreshCw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}
