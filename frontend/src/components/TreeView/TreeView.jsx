import { useCallback, useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { fetchTree } from '@/api/units';
import TreeNode from './TreeNode';

// pixels per level for indentation
const INDENT_PX = 16;
const ROW_HEIGHT = 28;

const TreeView = forwardRef(function TreeView({ selectedId }, ref) {
  /** Map<number, {
   *   data: Unit,
   *   childrenIds?: number[],
   * }>
   */
  const [nodes, setNodes] = useState(new Map());
  const [rootIds, setRootIds] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const loadingRef = useRef(new Set());
const listRef = useRef(null);
const [showFullTree, setShowFullTree] = useState(true);
const [pathIds, setPathIds] = useState([]); // track nodes currently loading children

  // initial load roots
  useEffect(() => {
    (async () => {
      try {
        const roots = await fetchTree();
        setNodes((prev) => {
          const m = new Map(prev);
          roots.forEach((n) => m.set(n.id, { data: n }));
          return m;
        });
        setRootIds(roots.map((n) => n.id));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchChildren = useCallback(async (id) => {
    if (loadingRef.current.has(id)) return;
    loadingRef.current.add(id);
    try {
      const children = await fetchTree(id);
      setNodes((prev) => {
        const m = new Map(prev);
        const parent = m.get(id);
        if (parent) {
          parent.childrenIds = children.map((c) => c.id);
        }
        children.forEach((c) => {
          if (!m.has(c.id)) m.set(c.id, { data: c });
        });
        return m;
      });
    } catch (e) {
      console.error(e);
    } finally {
      loadingRef.current.delete(id);
    }
  }, []);

  const toggleExpand = useCallback(
    async (id) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      const node = nodes.get(id);
      if (node && node.data.direct_children_count > 0 && node.childrenIds === undefined) {
        await fetchChildren(id);
      }
    },
    [nodes, fetchChildren],
  );

  // build flattened visible list
  const visible = useMemo(() => {
    const res = [];
    const dfs = (id, depth) => {
      const node = nodes.get(id);
      if (!node) return;
      const isExpanded = expanded.has(id);
      res.push({ id, node: node.data, depth, isExpanded });
      if (isExpanded && node.childrenIds) {
        node.childrenIds.forEach((childId) => dfs(childId, depth + 1));
      }
    };
    if (showFullTree) {
      rootIds.forEach((id) => dfs(id, 0));
    } else {
      pathIds.forEach((id, depth) => {
        const node = nodes.get(id);
        if (!node) return;
        const isExpanded = depth < pathIds.length - 1; // all but leaf
        res.push({ id, node: node.data, depth, isExpanded });
      });
    }
    return res;
  }, [rootIds, nodes, expanded, showFullTree, pathIds]);

  // react-window row renderer
  const Row = ({ index, style, data }) => {
    const { list, toggle } = data;
    const item = list[index];
    return (
      <div style={style}>
        <TreeNode
          node={item.node}
          depth={item.depth}
          isExpanded={item.isExpanded}
          toggleExpand={toggle}
          selected={item.id === selectedId}
        />
      </div>
    );
  };

  useEffect(() => {
    if (!selectedId) return;
    const idx = visible.findIndex((v) => v.id === selectedId);
    if (idx >= 0 && listRef.current) {
      listRef.current.scrollToItem(idx, 'center');
    }
  }, [selectedId, visible]);

  useImperativeHandle(ref, () => ({
    async showPath(pathArray) {
      if (!Array.isArray(pathArray) || pathArray.length === 0) return;
      // Ensure each node in path (except leaf) has childrenIds
      for (let i = 0; i < pathArray.length - 1; i += 1) {
        const node = nodes.get(pathArray[i].id);
        if (!node || node.childrenIds === undefined) {
          // eslint-disable-next-line no-await-in-loop
          await fetchChildren(pathArray[i].id);
        }
      }
      // Integrate nodes
      setNodes((prev) => {
        const m = new Map(prev);
        pathArray.forEach((u) => {
          if (!m.has(u.id)) m.set(u.id, { data: u });
        });
        // link parent->child
        for (let i = 0; i < pathArray.length - 1; i += 1) {
          const parentId = pathArray[i].id;
          const childId = pathArray[i + 1].id;
          const rec = m.get(parentId);
          if (rec) {
            if (!rec.childrenIds) rec.childrenIds = [];
            if (!rec.childrenIds.includes(childId)) rec.childrenIds.push(childId);
          }
        }
        return m;
      });
      // expand parents
      setExpanded((prev) => {
        const s = new Set(prev);
        pathArray.slice(0, -1).forEach((u) => s.add(u.id));
        return s;
      });
      setPathIds(pathArray.map((u) => u.id));
      setShowFullTree(false);
    },
  }));

  return (
    <div className="h-full flex flex-col overflow-x-auto">
      <div className="mb-2">
        <button
          type="button"
          className="text-sm px-2 py-1 rounded border bg-white hover:bg-gray-50"
          onClick={() => setShowFullTree((prev) => !prev)}
        >
          {showFullTree ? 'Показать путь' : 'Показать всё дерево'}
        </button>
      </div>
      <List
        ref={listRef}
        height={600}
        itemCount={visible.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        itemData={{ list: visible, toggle: toggleExpand }}
      >
        {Row}
      </List>
    </div>
  );
});

export default TreeView;
