import { useCallback, useRef, useState } from 'react';
import SearchInput from '@/components/SearchInput/SearchInput';
import SearchResultsList from '@/components/SearchResultsList/SearchResultsList';
import TreeView from '@/components/TreeView/TreeView';
import { searchUnits, fetchPath } from '@/api/units';

export default function HomePage() {
  const [results, setResults] = useState([]);
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
      <div className="bg-white rounded shadow p-2 overflow-auto">
        <h2 className="font-semibold mb-2">Дерево иерархии</h2>
        <TreeView ref={treeRef} selectedId={selectedId} />
      </div>
    </div>
  );
}
