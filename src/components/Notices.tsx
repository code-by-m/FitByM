import { createContext, useContext, useState, type ReactNode } from 'react';
import { ZodError } from 'zod';
const Context = createContext<(message: string) => void>(() => {});
export function Notices({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  return (
    <Context.Provider
      value={(m) => {
        setMessage(m);
        setTimeout(() => setMessage(''), 5000);
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status" onClick={() => setMessage('')}>
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
export const useNotice = () => useContext(Context);
export function useAction() {
  const notice = useNotice();
  return async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) notice(success);
    } catch (e) {
      notice(
        e instanceof ZodError
          ? `Verileri kontrol edin: ${e.issues[0]?.message ?? 'Geçersiz kayıt.'}`
          : e instanceof Error
            ? e.message
            : 'İşlem tamamlanamadı.',
      );
    }
  };
}
