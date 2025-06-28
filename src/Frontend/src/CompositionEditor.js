// CompositionEditor.js
import React from 'react';
import { useImmer } from 'use-immer';

export default function CompositionEditor({ composition, setComposition, options }) {
  const handleLipidChange = (oldKey, newKey) => {
    setComposition(draft => {
      const entry = draft[oldKey];
      delete draft[oldKey];
      draft[newKey] = entry;
    });
  };

  return (
    <fieldset>
      <legend>COMPOSITION</legend>
      {Object.entries(composition).map(([lipidId, info]) => (
        <div key={lipidId} className="comp-row">
          <select
            value={lipidId}
            onChange={e => handleLipidChange(lipidId, e.target.value)}
          >
            <option value="" disabled>Select lipid ID…</option>
            {options.map(id => <option key={id} value={id}>{id}</option>)}
          </select>

          <input
            placeholder="Name"
            value={info.NAME || ''}
            onChange={e =>
              setComposition(draft => { draft[lipidId].NAME = e.target.value.trimEnd(); })
            }
          />

          <input
            placeholder="Mapping"
            value={info.MAPPING || ''}
            onChange={e =>
            setComposition(draft => {
              draft[lipidId].MAPPING = e.target.value.trimEnd();
            })
          }
          />

          <button type="button" onClick={() =>
            setComposition(draft => { delete draft[lipidId]; })
          }>✕</button>
        </div>
      ))}

      <button type="button" onClick={() =>
        setComposition(draft => { draft[''] = { NAME:'', MAPPING:'' }; })
      }>+ Add Composition</button>
    </fieldset>
  );
}