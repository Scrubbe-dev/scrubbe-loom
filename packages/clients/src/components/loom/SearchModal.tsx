"use client";
import { useState, useEffect, useRef } from "react";
import { IoMdClose } from "react-icons/io";
import { RiSearchLine } from "react-icons/ri";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus the search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log("Searching for:", searchQuery);
    // Keep the modal open to show results or close it depending on UX needs
  };

  return (
    <section className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Very light gray, almost transparent overlay */}

      <div
        className="absolute inset-0 backdrop-blur-md bg-black/40"
        onClick={onClose}
      ></div>

      {/* Modal container - now with responsive width */}
      <article className="relative w-[280px] sm:w-[480px] md:w-full md:max-w-2xl mt-8 sm:mt-16 md:mt-24 mx-4 bg-white rounded-lg shadow-lg animate-fadeIn">
        {/* Search form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center border-b border-gray-200">
            <RiSearchLine size={20} className="ml-3 sm:ml-4 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Documentation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 sm:p-4 pl-2 text-base sm:text-lg text-gray-800 bg-transparent outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-2 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <IoMdClose size={18} />
            </button>
          </div>
        </form>

        {/* Search results container - would be populated with actual results */}
        <div className="max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto p-3 sm:p-4">
          {searchQuery && (
            <div className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              Showing results for `{searchQuery}`
            </div>
          )}

          {/* This would be replaced with actual search results */}
          <div className="py-12 sm:py-16 text-center text-gray-500 text-sm sm:text-base">
            {searchQuery
              ? "Type to search documentation"
              : "Start typing to search documentation"}
          </div>
        </div>
      </article>
    </section>
  );
};

export default SearchModal;
