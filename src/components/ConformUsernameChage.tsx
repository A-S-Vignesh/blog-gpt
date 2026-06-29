import { FaExclamationTriangle } from "react-icons/fa";

interface ConfirmUsernameChangeProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmUsernameChange({
  onConfirm,
  onCancel,
}: ConfirmUsernameChangeProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300">
            <FaExclamationTriangle />
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Change username?
          </h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          You can change your username <strong>only once</strong>, and it is
          permanent. Your old handle will redirect to the new one, and you will
          be signed out to refresh your session.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
          >
            Change permanently
          </button>
        </div>
      </div>
    </div>
  );
}

type InfoModalType = "success" | "error";

interface InfoModalProps {
  type: InfoModalType;
  title: string;
  message: string;
  onClose: () => void;
}

export function InfoModal({ type, title, message, onClose }: InfoModalProps) {
  const colors =
    type === "success"
      ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
      : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className={`p-3 rounded-full mb-4 inline-block ${colors}`}>
          {type === "success" ? "✅" : "❌"}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
