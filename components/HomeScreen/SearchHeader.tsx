import React from 'react';
import { Search } from 'lucide-react';

interface SearchHeaderProps {
  title: string;
  search: string;
  setSearch: (value: string) => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ title, search, setSearch }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-purple-500">{title}</h2>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search courses..." 
            className="pl-8 pr-4 py-1 border rounded-md text-sm w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;