// Builds html fields from the data
export default function ScalarFields({ data, onChange,fieldConfig }) {
  return (
    <div className="scalar-fields">
      {Object.entries(fieldConfig).map(([key, { type: fieldType, required }]) => {
        // Determine display value
        const rawVal = data[key];
        // Handle null or undefined values for html display
        const value = rawVal == null
          ? (fieldType === 'string' ? '' : undefined)
          : rawVal;

        // Build input props based on type
        let inputProps = { type: 'text' };
        if (fieldType === 'integer') {
          inputProps = { type: 'text', inputMode: 'numeric', pattern: '[0-9]*', placeholder: '0' };
        } else if (fieldType === 'float') {
          inputProps = { type: 'number', step: 'any' };
        }
        return (
          <div key={key} className="field">
            <label htmlFor={key}>
              {key}{required && ' (required)'}
            </label>
            <input
              id={key}
              name={key}
              value={value}
              onChange={onChange}
              required={required}
              {...inputProps}
            />
          </div>
        );
      })}
    </div>
  );
}
