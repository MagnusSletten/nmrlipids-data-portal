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