// Builds html fields from the data
export default function ScalarFields({ data, onChange, fieldConfig, dropdownOptions }) {
  return (
    <>    
    <div className="scalar-fields">
      {Object.entries(fieldConfig).map(([key, {
        type: fieldType,
        required,
        dropdown,
        description,
        unit,
      }]) => {
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

        const label = (
          <label htmlFor={key} title={description || ''}>
            {key}
            {unit && ` (${unit})`}
             {required && <span className="required-asterisk"> *</span>}
          </label>
        );

        if (!dropdown) {
          return (
            <div key={key} className="field">
              {label}
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
        }

        return (
          <div key={key} className="field">
            {label}
            <select
              id={key}
              name={key}
              value={value ?? ''}
              onChange={onChange}
              required={required}
            >
              <option value="">Select an option</option>
              {dropdownOptions[key].map(softwareOption => (
                <option key={softwareOption} value={softwareOption}>
                  {softwareOption}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
    <div className="required-hint">Fields marked with "*" are required. Hover over a field label for more information.
</div>
      </>
  );

}
