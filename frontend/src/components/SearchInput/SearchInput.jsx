import { useState, useCallback } from 'react';
import debounce from 'lodash.debounce';
import clsx from 'clsx';

export default function SearchInput({ onSearch, className }) {
  const [value, setValue] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounced = useCallback(
    debounce((v) => onSearch(v), 400, { leading: false }),
    [onSearch],
  );

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    debounced(v);
  };

  return (
    <input
      type="text"
      placeholder="Поиск по названию, бин, код ГУ, код abp"
      value={value}
      onChange={handleChange}
      className={clsx(
        'w-full rounded-md border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none',
        className,
      )}
    />
  );
}
