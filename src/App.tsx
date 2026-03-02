import { useState, useMemo, useCallback, useRef } from 'react';
import type { TripRow, Filters } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import UploadScreen from './components/UploadScreen';
import FilterBar from './components/FilterBar';
import MetricCards from './components/MetricCards';
import MonthlySpendChart from './components/charts/MonthlySpendChart';
import SpendByProductChart from './components/charts/SpendByProductChart';
import SpendByStatusChart from './components/charts/SpendByStatusChart';
import TripTable from './components/TripTable';
import TripMap from './components/TripMap';
import { FileText, Upload, SearchX } from 'lucide-react';

function Dashboard({ rawData, fileName, onReset }: { rawData: TripRow[]; fileName: string; onReset: () => void }) {
  const [filters, setFilters] = useState<Filters>(() => {
    const allStatuses = [...new Set(rawData.map(d => d.status))];
    const allProducts = [...new Set(rawData.map(d => d.product_type_name))];
    return {
      dateRange: [null, null],
      statuses: allStatuses,
      products: allProducts,
    };
  });

  const [selectedTripIndex, setSelectedTripIndex] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Derive filtered data
  const filteredData = useMemo(() => {
    return rawData.filter(d => {
      const [start, end] = filters.dateRange;
      if (start && d.request_timestamp_local < start) return false;
      if (end && d.request_timestamp_local > end) return false;
      if (!filters.statuses.includes(d.status)) return false;
      if (!filters.products.includes(d.product_type_name)) return false;
      return true;
    });
  }, [rawData, filters]);

  // Detect currency from filtered data
  const currency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of filteredData) {
      const c = d.currency_code || 'USD';
      counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'USD';
  }, [filteredData]);

  const handleSelectTrip = useCallback((index: number) => {
    setSelectedTripIndex(prev => (prev === index ? null : index));
    // Scroll to map
    setTimeout(() => {
      mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const isEmpty = filteredData.length === 0;

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text leading-tight">Uber Trip Analyzer</h1>
              <p className="text-xs text-text-muted">{rawData.length} trips loaded</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt text-xs text-text-secondary font-medium">
              <FileText className="w-3 h-3" />
              {fileName}
            </span>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
            >
              <Upload className="w-3 h-3" />
              New file
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar data={rawData} filters={filters} filteredCount={filteredData.length} onChange={setFilters} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isEmpty ? (
          <div className="bg-surface rounded-2xl border border-border py-20 text-center">
            <SearchX className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-40" />
            <p className="text-lg font-semibold text-text mb-1">No trips match your filters</p>
            <p className="text-sm text-text-muted mb-4">Try broadening your date range or selecting more statuses</p>
            <button
              onClick={() => {
                const allStatuses = [...new Set(rawData.map(d => d.status))];
                const allProducts = [...new Set(rawData.map(d => d.product_type_name))];
                setFilters({ dateRange: [null, null], statuses: allStatuses, products: allProducts });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <MetricCards data={filteredData} />

            {/* Monthly area chart — full width */}
            <MonthlySpendChart data={filteredData} currency={currency} />

            {/* Donut + Bar side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendByProductChart data={filteredData} currency={currency} />
              <SpendByStatusChart data={filteredData} currency={currency} />
            </div>

            {/* Section heading */}
            <div className="pt-2">
              <h2 className="text-lg font-bold text-text">Trip Explorer</h2>
              <p className="text-sm text-text-muted">Click a row to view the route on the map below</p>
            </div>

            {/* Trip Table */}
            <TripTable
              data={filteredData}
              selectedTripIndex={selectedTripIndex}
              onSelectTrip={handleSelectTrip}
              currency={currency}
            />

            {/* Trip Map */}
            <div ref={mapRef}>
              <TripMap
                trip={selectedTripIndex !== null ? filteredData[selectedTripIndex] ?? null : null}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-text-muted">
          All data is processed locally in your browser. Nothing is uploaded to any server.
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [rawData, setRawData] = useState<TripRow[] | null>(null);
  const [fileName, setFileName] = useState('');

  const handleDataLoaded = useCallback((data: TripRow[], name: string) => {
    setRawData(data);
    setFileName(name);
  }, []);

  const handleReset = useCallback(() => {
    setRawData(null);
    setFileName('');
  }, []);

  return (
    <ErrorBoundary>
      {rawData ? (
        <Dashboard rawData={rawData} fileName={fileName} onReset={handleReset} />
      ) : (
        <UploadScreen onDataLoaded={handleDataLoaded} />
      )}
    </ErrorBoundary>
  );
}

export default App;
