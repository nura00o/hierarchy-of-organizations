import clsx from 'clsx';
import { FolderIcon } from '@heroicons/react/24/solid';

export default function TreeIcon({ level, className }) {
  // For now, one icon style; can vary by level or type later.
  return <FolderIcon className={clsx('h-4 w-4', className)} />;
}
