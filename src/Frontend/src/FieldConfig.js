// Contains information about how each field should be handled
const fieldConfig = {
  DOI:               { type: 'string',  trim: true,  required: true  },
  SOFTWARE:          { type: 'string',  trim: true,  required: true  },
  TRJ:               { type: 'string',  trim: true,  required: true  },
  TPR:               { type: 'string',  trim: true,  required: true  },
  PREEQTIME:         { type: 'integer', trim: false, required: true  },
  TIMELEFTOUT:       { type: 'integer', trim: false, required: true  },
  SYSTEM:            { type: 'string',  trim: true,  required: true  },
  PUBLICATION:       { type: 'string',  trim: true,  required: false },
  TEMPERATURE:       { type: 'float',   trim: false, required: false },
  AUTHORS_CONTACT:   { type: 'string',  trim: false, required: false },
  SOFTWARE_VERSION:  { type: 'string',  trim: true,  required: false },
  FF:                { type: 'string',  trim: true,  required: false },
  FF_SOURCE:         { type: 'string',  trim: true,  required: false },
  FF_DATE:           { type: 'string',  trim: true,  required: false },
  CPT:               { type: 'string',  trim: true,  required: false },
  LOG:               { type: 'string',  trim: true,  required: false },
  TOP:               { type: 'string',  trim: true,  required: false },
  GRO:               { type: 'string',  trim: true,  required: false },
  EDR:               { type: 'string',  trim: true,  required: false },
};

export default fieldConfig