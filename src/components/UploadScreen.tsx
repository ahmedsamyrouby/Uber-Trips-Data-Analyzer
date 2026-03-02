import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseAndClean } from '../utils/parseCSV';
import type { TripRow } from '../types';

interface UploadScreenProps {
  onDataLoaded: (data: TripRow[], fileName: string) => void;
}

export default function UploadScreen({ onDataLoaded }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please upload a CSV file.');
        return;
      }
      setError(null);
      setIsLoading(true);
      try {
        const data = await parseAndClean(file);
        if (data.length === 0) {
          setError('The CSV file contains no valid trip data.');
          setIsLoading(false);
          return;
        }
        onDataLoaded(data, file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse CSV file.');
        setIsLoading(false);
      }
    },
    [onDataLoaded],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-alt">
      <div className="w-full max-w-xl text-center">
        {/* Logo / title */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-light mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">
            Uber Trip Analyzer
          </h1>
          <p className="text-text-secondary text-base">
            Drop your Uber data export CSV to explore your ride history —
            everything stays in your browser.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-12
            transition-all duration-200 ease-out
            ${
              isDragging
                ? 'border-primary bg-primary-light scale-[1.02] shadow-lg shadow-primary/10'
                : 'border-border bg-surface hover:border-primary/50 hover:bg-primary-light/30'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onFileSelect}
          />

          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-text-secondary font-medium">Parsing your trips…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className={`
                  inline-flex items-center justify-center w-14 h-14 rounded-xl
                  transition-colors duration-200
                  ${isDragging ? 'bg-primary text-white' : 'bg-surface-alt text-text-muted'}
                `}
              >
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-text font-semibold text-lg mb-1">
                  {isDragging ? 'Drop it here!' : 'Drag & drop your CSV here'}
                </p>
                <p className="text-text-muted text-sm">
                  or <span className="text-primary underline underline-offset-2">click to browse</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-start gap-2 text-left bg-danger-light text-danger rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Hint */}
        <p className="mt-6 text-text-muted text-xs">
          Expects the CSV from{' '}
          <span className="font-medium">Uber → Account → Privacy → Download your data</span>.
          Your data never leaves this device.
        </p>
      </div>
    </div>
  );
}
