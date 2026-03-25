'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  searchable?: boolean;
}

export default function Table({ columns, data, onEdit, onDelete, searchable = true }: TableProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {searchable && (
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              {columns.map((col) => (
                <th key={col.key} className="text-left py-3 px-4 text-gray-400 font-medium">
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && <th className="text-left py-3 px-4 text-gray-400">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 text-white">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-300">
                          Modifier
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(item)} className="text-red-400 hover:text-red-300">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-gray-400">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
