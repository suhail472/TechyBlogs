import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (msgOrObj, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Normalize both addToast('text', 'type') and addToast({ message: 'text', type: 'type' })
    let text = msgOrObj;
    let toastType = type;
    if (typeof msgOrObj === 'object' && msgOrObj !== null) {
      text = msgOrObj.message || msgOrObj.text || JSON.stringify(msgOrObj);
      if (msgOrObj.type) toastType = msgOrObj.type;
    }

    // Schedule state update safely outside the current synchronous render cycle
    setTimeout(() => {
      set((state) => ({
        toasts: [...state.toasts, { id, message: String(text || ''), type: toastType }],
      }));

      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 3000);
    }, 0);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export default useToastStore;
