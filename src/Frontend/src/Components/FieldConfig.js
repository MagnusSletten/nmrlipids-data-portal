// Contains information about how each field should be handled
const fieldConfig = {
  DOI:               { type: 'string',  trim: true,  required: true,  dropdown: false },
  SOFTWARE:          { type: 'string',  trim: false, required: true,  dropdown: true  },
  TRJ:               { type: 'string',  trim: true,  required: true,  dropdown: false },
  TPR:               { type: 'string',  trim: true,  required: true,  dropdown: false },
  PREEQTIME:         { type: 'integer', trim: false, required: true,  dropdown: false },
  TIMELEFTOUT:       { type: 'integer', trim: false, required: true,  dropdown: false },
  SYSTEM:            { type: 'string',  trim: true,  required: true,  dropdown: false },
  PUBLICATION:       { type: 'string',  trim: true,  required: false, dropdown: false },
  TEMPERATURE:       { type: 'float',   trim: false, required: false, dropdown: false },
  AUTHORS_CONTACT:   { type: 'string',  trim: false, required: true,  dropdown: false },
  SOFTWARE_VERSION:  { type: 'string',  trim: true,  required: false, dropdown: false },
  FF:                { type: 'string',  trim: true,  required: true,  dropdown: false },
  FF_SOURCE:         { type: 'string',  trim: true,  required: false, dropdown: false },
  FF_DATE:           { type: 'string',  trim: true,  required: false, dropdown: false },
  CPT:               { type: 'string',  trim: true,  required: false, dropdown: false },
  LOG:               { type: 'string',  trim: true,  required: false, dropdown: false },
  TOP:               { type: 'string',  trim: true,  required: false, dropdown: false },
  GRO:               { type: 'string',  trim: true,  required: false, dropdown: false },
  EDR:               { type: 'string',  trim: true,  required: false, dropdown: false },
};

export default fieldConfig;

export const dropdownOptions = { SOFTWARE :['gromacs', 'openMM', 'NAMD']}