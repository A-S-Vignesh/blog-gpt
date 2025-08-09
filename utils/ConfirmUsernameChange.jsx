import { useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export function ConfirmUsernameChange({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Change Username?
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Changing your username will log you out for security reasons.
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
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Yes, Update & Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export function InfoModal({ type, title, message, onClose }) {
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

