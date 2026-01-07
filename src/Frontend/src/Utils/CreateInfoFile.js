export default function CreateInfoFile(data){

  const { LIPID_COMPOSITION = {}, SOLUTION_COMPOSITION = {}, ...rest } = data;

  // Removes null or empty values from data object:
  const filteredData = Object.fromEntries(
  Object.entries(rest).filter(([_, v]) => {
    if (v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)
      return false;
    return true;
  })
  );

if (filteredData['BinaryTopology']) {
    const topo = filteredData['BinaryTopology'];
    const lower = topo.toLowerCase();

    if (lower.endsWith('.tpr')) {
      filteredData.TPR = topo;
    } else if (lower.endsWith('.psf')) {
      filteredData.PSF = topo;
    }
    else {
      throw new Error(`Binary topology must be a .tpr or .psf file, but got: "${topo}"`)
    }
    delete filteredData['BinaryTopology'];
    
  }

  if (filteredData['Structure']) {
    const struct = filteredData['Structure'];
    const lower = struct.toLowerCase();

    if (lower.endsWith('.gro')) {
      filteredData.GRO = struct;
    } else if (lower.endsWith('.pdb')) {
      filteredData.PDB = struct;
    }
    else {
      throw new Error("Structure must be a .gro or .pdb file)")
    }
    delete filteredData['Structure'];
  }


const merged = { ...LIPID_COMPOSITION, ...SOLUTION_COMPOSITION };

const COMPOSITION = Object.fromEntries(
  Object.entries(merged).filter(([k, v]) => {
    if (!k || k.trim() === "") return false;           
    if (!v || typeof v !== "object") return false;     

    const { NAME, MAPPING } = v;
    if (!NAME || NAME.trim() === "") return false;
    if (!MAPPING || MAPPING.trim() === "") return false;

    return true;
  })
);

const infoFile = { ...filteredData, COMPOSITION };
return infoFile;

}