import React, { useState, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileDropZoneProps {
  onFileDrop: (file: File) => void;
  children: React.ReactNode;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileDrop, children }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        onFileDrop(file);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFileDrop]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}

      {isDragging && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(9, 12, 16, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '2px dashed var(--accent-cyan)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 999,
            pointerEvents: 'none',
          }}
        >
          <UploadCloud size={48} color="#00f0ff" />
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>
            DROP ENVIRONMENT MODEL OR HDRI
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Supports self-contained .glb, .gltf, or Radiance .hdr image
          </div>
        </div>
      )}
    </div>
  );
};
