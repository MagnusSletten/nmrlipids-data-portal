// Handles UnitedAtomDict input 

import { useEffect, useState } from 'react';

export default function UnitedAtomDictEditor({ data, setData }) {
  const [dictEntries, setDictEntries] = useState([]);

  useEffect(() => {
    setDictEntries(
      Object.entries(data.UNITEDATOM_DICT || {}).map(([key, value]) => ({ key, value }))
    );
  }, [data.UNITEDATOM_DICT]);

  const addDictEntry = () => {
    setDictEntries(entries => [...entries, { key: '', value: '' }]);
  };

  const updateDictEntry = (index, field, val) => {
    setDictEntries(entries => {
      const newEntries = entries.map((e, i) =>
        i === index ? { ...e, [field]: val } : e
      );
      const obj = newEntries.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {});
      setData(draft => { draft.UNITEDATOM_DICT = obj; });
      return newEntries;
    });
  };

  const removeDictEntry = index => {
    setDictEntries(entries => {
      const newEntries = entries.filter((_, i) => i !== index);
      const obj = newEntries.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {});
      setData(draft => { draft.UNITEDATOM_DICT = obj; });
      return newEntries;
    });
  };

  return (
    <fieldset className="united-dict-section">
      <legend>UNITEDATOM_DICT</legend>
      {dictEntries.map((entry, idx) => (
        <div key={idx} className="dict-entry">
          <input
            type="text"
            placeholder="Key"
            value={entry.key}
            onChange={e => updateDictEntry(idx, 'key', e.target.value)}
          />
          <input
            type="text"
            placeholder="Value"
            value={entry.value}
            onChange={e => updateDictEntry(idx, 'value', e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeDictEntry(idx)}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={addDictEntry}>+ Add Entry</button>
    </fieldset>
  );
}
