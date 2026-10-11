import React from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';

export const LoadingOverlay: React.FC = () => {
  const { isLoading, loadingMessage, loadingProgress, errorMessage } = useEditorStore();

  if (!isLoading && !errorMessage) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(9, 12, 16, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      {errorMessage ? (
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            maxWidth: '460px',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontWeight: 600, fontSize: '15px' }}>
              <AlertCircle size={20} />
              <span>Import / Processing Error</span>
            </div>
            <button
              onClick={() => editorStore.setErrorMessage(null)}
              style={{ background: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
            {errorMessage}
          </div>

          <button
            className="nav-btn nav-btn-primary"
            style={{ alignSelf: 'flex-end', marginTop: '8px' }}
            onClick={() => editorStore.setErrorMessage(null)}
          >
            Dismiss
          </button>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '28px 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            minWidth: '280px',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <Loader2 size={32} color="#00f0ff" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
            {loadingMessage || 'Processing Environment...'}
          </div>

          {loadingProgress > 0 && (
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-control)', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${loadingProgress}%`,
                  height: '100%',
                  background: 'var(--accent-cyan)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
