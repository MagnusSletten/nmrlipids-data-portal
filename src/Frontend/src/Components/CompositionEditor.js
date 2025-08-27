// Handles the composition dictionary within the data
export default function CompositionEditor({ composition, setComposition, options, mappingDict, name }) {
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
      <legend>{name}</legend>
      {Object.entries(composition).map(([compositionId, info]) => {
        const mappingOptions = mappingDict[compositionId] || [];
        return (
          <div key={compositionId} className="comp-row">
            <select
              value={compositionId}
              onChange={e => handleLipidChange(compositionId, e.target.value)}
            >
              <option value="" disabled>Select composition ID…</option>
              {options.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>

            <input
              placeholder="Name"
              value={info.NAME || ''}
              required
              onChange={e =>
                setComposition(draft => {
                  draft[compositionId].NAME = e.target.value.trimEnd();
                })
              }
            />

            <select
              className="mapping-select"
              required
              placeholder="Mapping"
              value={info.MAPPING || ''}
              onChange={e =>
                setComposition(draft => {
                  draft[compositionId].MAPPING = e.target.value;
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
                  delete draft[compositionId];
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
