import React, { useState, useRef } from 'react';
import { api } from '../../api';
import { useAppStore } from '../../store';
import {
  FileText, UploadCloud, Download, Trash2, FolderOpen,
  FileSpreadsheet, Image as ImageIcon, FileArchive
} from 'lucide-react';
import dayjs from 'dayjs';

interface MaterialsSectionProps {
  classId: string;
}

export default function MaterialsSection({ classId }: MaterialsSectionProps) {
  const currentUser   = useAppStore(s => s.currentUser);
  const classrooms    = useAppStore(s => s.classrooms);
  const rawMaterials  = useAppStore(s => s.materials);
  const uploadMaterial   = useAppStore(s => s.uploadMaterial);
  const deleteMaterial   = useAppStore(s => s.deleteMaterial);
  const downloadMaterial = useAppStore(s => s.downloadMaterial);
  const addToast = useAppStore(s => s.addToast);

  const classroom = classrooms.find(c => c.id === classId);
  // Creator check: compare user id with classroom creator id
  const isCreator = !!classroom && currentUser?.id === classroom.creatorId;

  const materials = React.useMemo(
    () => rawMaterials.filter(m => m.classId === classId),
    [rawMaterials, classId]
  );

  const [dragActive,  setDragActive]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Prevent the hidden input from being used multiple times via same-file selection
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileCategory = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf')  return { color: 'text-red-500   bg-red-50   border-red-200',   text: 'PDF'   };
    if (ext === 'xlsx' || ext === 'xls') return { color: 'text-green-500 bg-green-50 border-green-200', text: 'XLSX' };
    if (ext === 'docx' || ext === 'doc') return { color: 'text-blue-500  bg-blue-50  border-blue-200',  text: 'DOCX' };
    if (['jpg','jpeg','png','gif'].includes(ext || '')) return { color: 'text-purple-500 bg-purple-50 border-purple-200', text: 'IMAGE' };
    return { color: 'text-gray-500 bg-gray-50 border-gray-200', text: 'FILE' };
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return FileSpreadsheet;
    if (['jpg','jpeg','png','gif'].includes(ext || '')) return ImageIcon;
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx') return FileText;
    return FileArchive;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  // FIX: use ref to reset input so same file can be re-selected; 
  // do NOT auto-upload on select — wait for user to confirm
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
    // reset so same file can be picked again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      addToast('File too large. Max 20MB allowed.', 'error');
      return;
    }
    setSelectedFile(file);
  };

  // FIX: single upload trigger — only called once via button click
  const handleConfirmUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setUploadPct(10);

    // Fake progress UI
    const interval = setInterval(() => {
      setUploadPct(p => {
        if (p >= 85) { clearInterval(interval); return 85; }
        return p + 15;
      });
    }, 200);

    try {
      await uploadMaterial(classId, selectedFile, selectedFile.name);
      setUploadPct(100);
    } catch {
      // error toast handled inside store
    } finally {
      clearInterval(interval);
      setUploading(false);
      setSelectedFile(null);
      setUploadPct(0);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-brand-dark flex items-center gap-2">
            📁 Class Materials
          </h2>
          <p className="text-xs text-brand-dark/65 font-semibold uppercase tracking-wider mt-1">
            {isCreator ? 'Upload and manage files for your students.' : 'Download files shared by your instructor.'}
          </p>
        </div>
      </div>

      {/* Upload zone — creator only */}
      {isCreator && (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
            dragActive ? 'border-brand-primary bg-[#0F8B8D]/10' : 'border-brand-primary/30 bg-[#0F8B8D]/5'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            disabled={uploading}
          />

          {!selectedFile && !uploading && (
            <>
              <UploadCloud className="w-10 h-10 text-brand-primary mb-3" />
              <p className="font-bold text-sm text-brand-dark">
                Drag & drop here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-brand-primary underline"
                >
                  browse files
                </button>
              </p>
              <p className="text-[10px] font-bold text-brand-dark/50 uppercase tracking-widest mt-1">
                PDF, DOCX, XLSX, JPG, PNG — max 20 MB
              </p>
            </>
          )}

          {selectedFile && !uploading && (
            <div className="space-y-3 w-full max-w-xs">
              <p className="font-bold text-sm text-brand-dark truncate">{selectedFile.name}</p>
              <p className="text-xs text-brand-dark/60">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/90"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 bg-gray-100 text-brand-dark text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="w-full max-w-xs space-y-2">
              <p className="text-xs font-bold text-brand-dark truncate">{selectedFile?.name}</p>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary transition-all duration-300" style={{ width: `${uploadPct}%` }} />
              </div>
              <p className="text-[10px] text-brand-dark/50 font-bold uppercase animate-pulse">
                Uploading... {uploadPct}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Materials list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden">
        {materials.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-8 h-8 text-brand-dark/30 mx-auto mb-3" />
            <h4 className="font-bold text-brand-dark text-base mb-1">No Materials Yet</h4>
            <p className="text-xs text-brand-dark/60 max-w-xs mx-auto">
              {isCreator ? 'Upload files to share with your students.' : 'Your instructor has not shared any files yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-brand-dark/70 border-b border-gray-100 uppercase tracking-wider">
                  <th className="py-4 px-6">File</th>
                  <th className="py-4 px-4 hidden sm:table-cell">Type</th>
                  <th className="py-4 px-4 hidden md:table-cell">Uploaded By</th>
                  <th className="py-4 px-4 hidden sm:table-cell">Date</th>
                  <th className="py-4 px-4">Size</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materials.map(mat => {
                  const cat  = getFileCategory(mat.name);
                  const Icon = getFileIcon(mat.name);
                  return (
                    <tr key={mat.id} className="hover:bg-[#0F8B8D]/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${cat.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-xs truncate max-w-[180px]" title={mat.name}>
                            {mat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden sm:table-cell">
                        <span className="text-[10px] bg-brand-light/35 text-brand-dark font-black tracking-wider uppercase px-2 py-0.5 rounded-full border border-gray-200">
                          {cat.text}
                        </span>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0F8B8D] flex items-center justify-center text-white text-[10px] font-black">
                            {(mat.uploadedBy || 'I')[0]}
                          </div>
                          <span className="text-xs font-medium text-brand-dark/80">{mat.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden sm:table-cell text-xs font-medium text-brand-dark/70">
                        {dayjs(mat.uploadedAt).format('MMM DD, YYYY')}
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-brand-dark/70">{mat.size}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {/* FIX: blob download forces save instead of browser preview */}
                          <button
                            title="Download"
                            onClick={async () => {
                              if (mat.downloadUrl) {
                                try {
                                  addToast('Downloading...', 'info');
                                  await api.downloadFileAsBlob(mat.downloadUrl, mat.name);
                                } catch { addToast('Download failed', 'error'); }
                              } else {
                                downloadMaterial(classId, mat.id, mat.name);
                              }
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-brand-primary transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {/* Delete — creator only */}
                          {isCreator && (
                            <button
                              title="Delete"
                              onClick={() => deleteMaterial(classId, mat.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}