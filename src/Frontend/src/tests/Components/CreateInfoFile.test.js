import CreateInfoFile from '../../Components/CreateInfoFile';

describe('CreateInfoFile', () => {
  test('removes empty/null/blank scalars, empty arrays, and empty objects from root', () => {
    const input = {
      TITLE: 'My system',
      NOTES: '',                // remove
      EXTRA: null,              // remove
      TAGS: [],                 // remove
      META: {},                 // remove
      NUMBER: 0,                // keep (not empty)
      FLAG: false,              // keep
      LIPID_COMPOSITION: {},
      SOLUTION_COMPOSITION: {},
    };

    const out = CreateInfoFile(input);

    expect(out).toEqual({
      TITLE: 'My system',
      NUMBER: 0,
      FLAG: false,
      COMPOSITION: {},          // present but empty
    });
  });


  test('filters out invalid composition entries (empty key / missing NAME or MAPPING / non-object)', () => {
    const input = {
      LIPID_COMPOSITION: {
        '':           { NAME: 'POPE', MAPPING: 'pope.yaml' }, // empty key -> drop
        DOPC:         { NAME: '',     MAPPING: 'dopc.yaml' }, // empty NAME -> drop
        DOPE:         { NAME: 'DOPE', MAPPING: '' },          // empty MAPPING -> drop
        JUNK:         'not-an-object',                        // non-object -> drop
        OK1:          { NAME: 'PC1',  MAPPING: 'pc1.yaml' },  // keep
        '  ':         { NAME: 'X',    MAPPING: 'x.yaml' },    // whitespace key -> drop
      },
      SOLUTION_COMPOSITION: {
        OK2: { NAME: 'CL', MAPPING: 'cl.yaml' },             // keep
      },
    };

    const out = CreateInfoFile(input);

    expect(out.COMPOSITION).toEqual({
      OK1: { NAME: 'PC1', MAPPING: 'pc1.yaml' },
      OK2: { NAME: 'CL',  MAPPING: 'cl.yaml' },
    });
  });

  test('treats whitespace-only NAME/MAPPING as empty (dropped)', () => {
    const input = {
      LIPID_COMPOSITION: {
        KEEP: { NAME: 'POPC', MAPPING: 'popc.yaml' }, // passes validation
        DROP: { NAME: '   ',      MAPPING: 'ok.yaml' },       // NAME whitespace -> drop
      },
    };

    const out = CreateInfoFile(input);

    expect(out.COMPOSITION).toEqual({
      KEEP: { NAME: 'POPC', MAPPING: 'popc.yaml' },   // preserved as-is
    });
    expect(out.COMPOSITION.DROP).toBeUndefined();
  });

  test('does not mutate the input object', () => {
    const input = {
      TITLE: 'A',
      LIPID_COMPOSITION: { POPC: { NAME: 'POPC', MAPPING: 'popc.yaml' } },
      SOLUTION_COMPOSITION: {},
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    CreateInfoFile(input);

    expect(input).toEqual(snapshot);
  });

  test('keeps unrelated non-empty root fields alongside COMPOSITION', () => {
    const input = {
      SYSTEM: 'Bilayer X',
      TEMPERATURE: 310,
      LIPID_COMPOSITION: { POPC: { NAME: 'POPC', MAPPING: 'popc.yaml' } },
      SOLUTION_COMPOSITION: {},
    };

    const out = CreateInfoFile(input);

    expect(out.SYSTEM).toBe('Bilayer X');
    expect(out.TEMPERATURE).toBe(310);
    expect(out.COMPOSITION).toEqual({
      POPC: { NAME: 'POPC', MAPPING: 'popc.yaml' },
    });
  });
});
