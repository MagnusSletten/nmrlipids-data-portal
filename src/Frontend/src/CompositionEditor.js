// Handles the composition dictionary within the data
export default function CompositionEditor({ composition, setComposition, options, mappingDict }) {
  const handleLipidChange = (oldKey, newKey) => {
    setComposition(draft => {
      const entry = draft[oldKey];
      delete draft[oldKey];
      entry.MAPPING = '';
      draft[newKey] = entry;
    });
  };

  const handleAdd = () => {
    setComposition(draft => {
      draft[''] = { NAME: '', MAPPING: '' };
    });
  };

  return (
    <fieldset>
      <legend>COMPOSITION</legend>
      {Object.entries(composition).map(([lipidId, info]) => {
        const mappingOptions = mappingDict[lipidId] || [];
        return (
          <div key={lipidId} className="comp-row">
            <select
              value={lipidId}
              onChange={e => handleLipidChange(lipidId, e.target.value)}
            >
              <option value="" disabled>Select lipid ID…</option>
              {options.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>

            <input
              placeholder="Name"
              value={info.NAME || ''}
              onChange={e =>
                setComposition(draft => {
                  draft[lipidId].NAME = e.target.value.trimEnd();
                })
              }
            />

            <select
              className="mapping-select"
              placeholder="Mapping"
              value={info.MAPPING || ''}
              onChange={e =>
                setComposition(draft => {
                  draft[lipidId].MAPPING = e.target.value;
                })
              }
            >
              <option value="" disabled>Select mapping…</option>
              {mappingOptions.map(mapping => (
                <option key={mapping} value={mapping}>{mapping}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                setComposition(draft => {
                  delete draft[lipidId];
                })
              }
            >
              ✕
            </button>
          </div>
        );
      })}

      <button type="button" onClick={handleAdd}>+ Add Composition</button>
    </fieldset>
  );
}
