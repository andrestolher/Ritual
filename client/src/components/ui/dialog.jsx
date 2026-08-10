import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
export { Dialog };
export function DialogContent({ children }) { return <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl focus:outline-none"><Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-ink/50 hover:bg-ink/5"><X size={18} /></Dialog.Close>{children}</Dialog.Content></Dialog.Portal>; }
