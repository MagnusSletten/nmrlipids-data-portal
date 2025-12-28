// Contains information about how each field should be handled
const fieldConfig = {
  DOI:               { type: 'string',  trim: true,  required: true,  dropdown: false, description: "DOI from where the raw data is found." },
  SOFTWARE:          { type: 'string',  trim: false, required: true,  dropdown: true, description: "Simulation software used to generate the trajectory."},
  TRJ:               { type: 'string',  trim: true,  required: true,  dropdown: false, description: "Name of the trajectory file found from DOI."},
  TPR:               { type: 'string',  trim: true,  required: true,  dropdown: false, description: "Name of the topology file found from DOI." },
  PREEQTIME:         { type: 'float',   trim: false, required: true,  dropdown: false, description: "How much simulation time happened before the part that the uploaded trajectory contains (in ns).", unit: "ns"
},
  TIMELEFTOUT:       { type: 'float',   trim: false, required: true,  dropdown: false, description: "How much of the uploaded trajectory should be treated as equilibration and skipped in analysis (in ns).", unit: "ns"
},
  SYSTEM:            { type: 'string',  trim: true,  required: true,  dropdown: false, description: "System description in the free text format."},
  PUBLICATION:       { type: 'string',  trim: true,  required: false, dropdown: false, description: "Reference to a publication(s) related to the data." },
  TEMPERATURE:       { type: 'float',   trim: false, required: false, dropdown: false, description: "Temperature of the simulation in Kelvin.", unit: "K"},
  AUTHORS_CONTACT:   { type: 'string',  trim: false, required: true,  dropdown: false, description: "Name and/or email of the main author(s) of the data."},
  SOFTWARE_VERSION:  { type: 'string',  trim: true,  required: false, dropdown: false, description: "Version of the used software." },
  FF:                { type: 'string',  trim: true,  required: true,  dropdown: false, description: "Name of the used force field." },
  FF_SOURCE:         { type: 'string',  trim: true,  required: false, dropdown: false, description: "Source of the force field parameters." },
  FF_DATE:           { type: 'string',  trim: true,  required: false, dropdown: false, description: "Date when force field parameters were accessed."  },
  CPT:               { type: 'string',  trim: true,  required: false, dropdown: false, description: "Name of the Gromacs checkpoint file." },
  LOG:               { type: 'string',  trim: true,  required: false, dropdown: false, description: "Name of the Gromacs log file." },
  TOP:               { type: 'string',  trim: true,  required: false, dropdown: false, description: "Name of the Gromacs top file." },
  GRO:               { type: 'string',  trim: true,  required: false, dropdown: false, description: "Name of the Gromacs gro file."},
  EDR:               { type: 'string',  trim: true,  required: false, dropdown: false, description: "Name of the Gromacs edr file."},
};

export default fieldConfig;

export const dropdownOptions = { SOFTWARE :['gromacs', 'openMM', 'NAMD']}