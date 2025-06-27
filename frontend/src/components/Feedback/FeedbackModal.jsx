import { useState } from 'react';
import { sendFeedback } from '@/api/feedback';

const labels = {
  bug: 'Сообщить об ошибке',
  suggestion: 'Предложить правку',
  comment: 'Оставить комментарий',
  contacts: 'Контакты',
};

export default function FeedbackModal({ type, onClose, selectedUnit }) {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const isContacts = type === 'contacts';

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Введите сообщение');
      return;
    }
    setLoading(true);
    try {
      await sendFeedback({
        type: labels[type],
        message,
        contact: contact || null,
        unitId: selectedUnit?.id || null,
      });
      alert('Сообщение отправлено');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Ошибка при отправке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-4 space-y-4">
        <h2 className="text-lg font-semibold text-center">{labels[type]}</h2>
        {isContacts ? (
          <div className="space-y-1 text-sm">
            <p>📞 Контакты:</p>
            <p>Телефон: +7 (7172) 123-456</p>
            <p>Почта: info@ecc.kz</p>
            <p>
              Сайт:{' '}
              <a href="https://ecc.kz/ru" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                https://ecc.kz/ru
              </a>
            </p>
          </div>
        ) : (
          <>
            <textarea
              className="w-full border rounded p-2 h-32 text-sm"
              placeholder="Ваше сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <input
              type="text"
              className="w-full border rounded p-2 text-sm"
              placeholder="Ваш контакт (необязательно)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Отправить
            </button>
          </>
        )}
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
    </div>
  );
}
