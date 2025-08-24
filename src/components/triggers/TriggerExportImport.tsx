'use client';

import { useState, useRef } from 'react';
import { TriggersExport } from '@/types';

interface TriggerExportImportProps {
  triggers: any[];
  onImport: (data: TriggersExport, replaceAll: boolean) => boolean;
  onExport: () => TriggersExport;
  statistics: {
    totalTriggers: number;
    activeTriggers: number;
    inactiveTriggers: number;
    structuresWithTriggers: number;
  };
}

export default function TriggerExportImport({
  triggers,
  onImport,
  onExport,
  statistics
}: TriggerExportImportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = onExport();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `geofencing-triggers-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as TriggersExport;
      
      // Validate the import data structure
      if (!data.version || !Array.isArray(data.triggers)) {
        throw new Error('Invalid trigger export format');
      }

      // Ask user if they want to replace all triggers or merge
      const replaceAll = window.confirm(
        `Import ${data.triggers.length} triggers?\n\n` +
        `• Choose "OK" to REPLACE all existing triggers\n` +
        `• Choose "Cancel" to MERGE with existing triggers`
      );

      const success = onImport(data, replaceAll);
      
      if (success) {
        setImportResult({
          success: true,
          message: `Successfully imported ${data.triggers.length} triggers ${replaceAll ? '(replaced all)' : '(merged)'}`
        });
      } else {
        setImportResult({
          success: false,
          message: 'Import failed. Please check the file format.'
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export & Import</h3>
      
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{statistics.totalTriggers}</div>
          <div className="text-sm text-gray-600">Total Triggers</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{statistics.activeTriggers}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{statistics.inactiveTriggers}</div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{statistics.structuresWithTriggers}</div>
          <div className="text-sm text-gray-600">Structures</div>
        </div>
      </div>

      {/* Export/Import Actions */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting || triggers.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Triggers
              </>
            )}
          </button>

          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            {isImporting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Importing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Import Triggers
              </>
            )}
          </button>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`p-3 rounded-lg ${
            importResult.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-sm font-medium">{importResult.message}</span>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <div>
            <strong>Export:</strong> Download all triggers as a JSON file for use in the Flutter app.
          </div>
          <div>
            <strong>Import:</strong> Upload a previously exported triggers file. You can choose to replace all existing triggers or merge with current ones.
          </div>
        </div>
      </div>
    </div>
  );
}
