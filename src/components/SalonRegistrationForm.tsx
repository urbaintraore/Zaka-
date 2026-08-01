import React, { useState } from 'react';
import { Role } from '../types';

export function SalonRegistrationForm({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700">Nombre de coiffeurs/coiffeuses</label>
        <input 
          type="number"
          value={formData.hairdresserCount || 0}
          onChange={(e) => setFormData({ ...formData, hairdresserCount: parseInt(e.target.value) })}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
}
