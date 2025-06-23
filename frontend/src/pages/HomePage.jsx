import { useCallback, useRef, useState } from 'react';
import { ArrowTopRightOnSquareIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput/SearchInput';
import SearchResultsList from '@/components/SearchResultsList/SearchResultsList';
import TreeView from '@/components/TreeView/TreeView';
import { searchUnits, fetchPath } from '@/api/units';

export default function HomePage() {
  const [results, setResults] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const treeRef = useRef(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = useCallback(
    async (q) => {
      setQuery(q);
      if (!q) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const data = await searchUnits({ query: q, exact: false, limit: 100, offset: 0 });
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  const handleSelectResult = useCallback(async (itm) => {
    setSelectedId(itm.id);
    setSelectedUnit(itm);
    setCopied(false);
    try {
      const path = await fetchPath(itm.id);
      treeRef.current?.showPath(path);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="container mx-auto p-4 grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <SearchInput onSearch={handleSearch} />
        {searching && <p className="text-sm text-gray-500">Поиск...</p>}
        {results.length > 0 && (
          <SearchResultsList
            items={results}
            query={query}
            height={600}
            onSelect={handleSelectResult}
            selectedId={selectedId}
          />
        )}
      </div>
      <div className="bg-white rounded shadow p-2 overflow-auto space-y-2">
        {selectedUnit && (
          <div className="p-2 border rounded bg-gray-50 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold flex-1 text-lg truncate" title={selectedUnit.name}>
                {selectedUnit.name}
              </h3>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Узнать подробнее на сайте gr5.e-qazyna.kz?\nВведите вручную БИН: ${selectedUnit.bin}`,
                    )
                  ) {
                    window.open(
                      'https://gr5.e-qazyna.kz/p/ru/gr-search/search-objects',
                      '_blank',
                      'noopener',
                    );
                  }
                }}
                title="Открыть gr5.e-qazyna.kz"
                className="text-blue-600 hover:text-blue-800"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              </button>
            </div>
            {selectedUnit.bin && (
              <div className="flex items-center gap-1 text-sm">
                <span>БИН: {selectedUnit.bin}</span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(selectedUnit.bin);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  title={copied ? 'Скопировано' : 'Скопировать БИН'}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
        <h2 className="font-semibold mb-2">Дерево иерархии</h2>
        <TreeView ref={treeRef} selectedId={selectedId} />
      </div>
    </div>
  );
}
