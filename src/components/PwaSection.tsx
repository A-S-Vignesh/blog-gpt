"use client";

import { FaMobileAlt } from "react-icons/fa";
import { useState } from "react";

function PwaSection() {

    const [isPWAInstallShown, setIsPWAInstallShown] = useState(false);

    const showPWAInstallPrompt = () => {
    setIsPWAInstallShown(true);
    
  };
    return (
        <section className="py-10 bg-gray-50 dark:bg-dark-100 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="max-w-4xl mx-auto bg-white dark:bg-dark-100 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 transition-shadow shadow-md flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-6 md:mb-0">
            <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
              <FaMobileAlt className="text-2xl text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Get the App Experience
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add Blog-GPT to your home screen for quick access
              </p>
            </div>
          </div>

          <button
            onClick={showPWAInstallPrompt}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-300 flex items-center"
          >
            <FaMobileAlt className="mr-2" /> Add to Home Screen
          </button>
        </div>
      </section>
    )
}

export default PwaSection;