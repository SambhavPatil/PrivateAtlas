import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Landmark } from '../types/map';

interface LandmarkFormProps {
  onSubmit: (landmark: Omit<Landmark, 'id'>) => void;
  onClose: () => void;
  position: [number, number];
}

export const LandmarkForm: React.FC<LandmarkFormProps> = ({
  onSubmit,
  onClose,
  position,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Landmark['type']>('building');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      position,
      type,
    });
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-[1000] w-96">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-semibold mb-4">Add Landmark</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Landmark['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="building">Building</option>
            <option value="parking">Parking</option>
            <option value="entrance">Entrance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Add Landmark
        </button>
      </form>
    </div>
  );
};