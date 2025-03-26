import React, { useState } from 'react';
import { X } from 'lucide-react';

interface RouteFormProps {
  type: 'vehicle' | 'walking';
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export const RouteForm: React.FC<RouteFormProps> = ({
  type,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name);
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-[1000] w-96">
      <button
        onClick={onCancel}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-semibold mb-4">
        Save {type === 'vehicle' ? 'Vehicle' : 'Walking'} Route
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Route Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter route name"
            required
          />
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Save Route
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};