import { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import FeedbackModal from './FeedbackModal.jsx';

const options = [
  { key: 'bug', label: 'Сообщить об ошибке' },
  { key: 'suggestion', label: 'Предложить правку' },
  { key: 'comment', label: 'Оставить комментарий' },
  { key: 'contacts', label: 'Контакты' },
];

export default function FeedbackMenu({ selectedUnit }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [modalType, setModalType] = useState(null);

  const openModal = (key) => {
    setOpenMenu(false);
    if (key === 'contacts') {
      setModalType('contacts');
    } else {
      setModalType(key);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpenMenu((v) => !v)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700"
        title="Обратная связь"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>
      {openMenu && (
        <div
          className="absolute right-0 mt-1 w-52 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 z-20"
          onMouseLeave={() => setOpenMenu(false)}
        >
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => openModal(opt.key)}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {modalType && (
        <FeedbackModal
          type={modalType}
          onClose={() => setModalType(null)}
          selectedUnit={selectedUnit}
        />
      )}
    </div>
  );
}
