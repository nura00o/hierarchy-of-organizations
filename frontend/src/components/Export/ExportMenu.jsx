import { useState } from 'react';
import { downloadJson, downloadExcel } from '@/api/exports';
import html2canvas from 'html2canvas';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function ExportMenu({ treeContainerRef }) {
  const [open, setOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCapturePng = async () => {
    setLoading(true);
    try {
      // Ensure we capture full scroll height
      const el = treeContainerRef.current;
      const canvas = await html2canvas(el, { useCORS: true, backgroundColor: '#fff', scrollY: -window.scrollY });
      const dataUrl = canvas.toDataURL();
      setPreviewSrc(dataUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPng = () => {
    if (!previewSrc) return;
    const a = document.createElement('a');
    a.href = previewSrc;
    a.download = 'units_tree.png';
    a.click();
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 text-sm rounded border bg-white hover:bg-gray-50"
      >
        <ArrowDownTrayIcon className="h-4 w-4" /> Экспорт
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 z-10"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => {
              setOpen(false);
              downloadJson();
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            📁 JSON
          </button>
          <button
            onClick={() => {
              setOpen(false);
              downloadExcel();
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            📊 Excel
          </button>
          <button
            onClick={() => {
              setOpen(false);
              handleCapturePng();
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            🖼️ PNG
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded shadow-lg max-h-full overflow-auto p-4 space-y-2">
            <img src={previewSrc} alt="Preview" className="max-w-full" />
            <div className="text-right space-x-2">
              <button
                onClick={() => setPreviewSrc(null)}
                className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
              >
                Закрыть
              </button>
              <button
                disabled={loading}
                onClick={handleDownloadPng}
                className="px-3 py-1 rounded border bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                Скачать PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
