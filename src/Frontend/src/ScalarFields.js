// ScalarFields.js
import React from 'react';

const compulsoryFields = new Set([
  'DOI',
  'SOFTWARE',
  'TRJ',
  'TPR',
  'PREEQTIME',
  'TIMELEFTOUT',
  'TYPEOFSYSTEM',
  'SYSTEM'
]);

export default function ScalarFields({ data, onChange, fields }) {
  return (
    <div className="scalar-fields">
      {fields.map(key => (
        <div key={key} className="field">
          <label>
            {key}
            {compulsoryFields.has(key) && <span> (required)</span>}
          </label>
          <input
            name={key}
            value={data[key] || ''}
            onChange={onChange}
          />
        </div>
      ))}
    </div>
  );
}