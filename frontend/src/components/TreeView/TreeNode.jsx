import React from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import TreeIcon from './TreeIcon';

function TreeNode({ node, depth, isExpanded, toggleExpand, selected }) {
  // indentation calculated via style to avoid thousands of nested divs
  const indentStyle = {
    paddingLeft: depth * 16,
  };

  return (
    <div
      className={`flex items-center min-w-0 select-none text-sm h-full cursor-pointer ${selected ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
      style={indentStyle}
      onClick={() => toggleExpand(node.id)}
    >
      {node.direct_children_count > 0 ? (
        isExpanded ? (
          <ChevronDownIcon className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        )
      ) : (
        <span className="h-4 w-4 inline-block" />
      )}
      <TreeIcon level={node.level} className="ml-1 mr-1 text-blue-600" />
      <span className="ml-1 flex-1 truncate" title={node.name}>{node.name}</span>
      <span
        className="ml-1 flex-shrink-0"
        title={`${node.direct_children_count} прямых, всего ${node.total_descendants_count} подчинённых`}
      >
        <span className="text-blue-500">{`🔹${node.direct_children_count}`}</span>
        <span className="ml-1 text-red-500">{`🔻${node.total_descendants_count}`}</span>
      </span>
    </div>
  );
}

export default React.memo(TreeNode);
