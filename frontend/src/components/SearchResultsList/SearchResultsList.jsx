import { FixedSizeList as List } from 'react-window';
import ResultItem from '../ResultItem/ResultItem';

export default function SearchResultsList({ items, query, height = 400, onSelect, selectedId }) {
  const Row = ({ index, style }) => {
    const itm = items[index];
    return (
      <div style={style} key={itm.id} >
        <ResultItem
          item={itm}
          query={query}
          selected={itm.id === selectedId}
          onClick={() => onSelect?.(itm)}
        />
      </div>
    );
  };

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={68}
      width="100%"
      className="border rounded bg-white"
      itemKey={(index) => items[index].id}
    >
      {Row}
    </List>
  );
}
