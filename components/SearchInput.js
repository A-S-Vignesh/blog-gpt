const SearchInput = ({ value, onChange }) => (
  <div className="w-full flex justify-center items-center mt-2 mb-8">
    <input
      type="text"
      name="search"
      value={value}
      onChange={onChange}
      placeholder="Search for Blogs..."
      className="text-sm font-medium focus:ring-0 border-black dark:border-white dark:text-white 
      border bg-transparent shadow-lg max-w-[90%]
      rounded-md sm:w-96 focus:outline-none focus:border-black pl-4 pr-12 py-2 sm:py-3"
    />
  </div>
);

export default SearchInput;
