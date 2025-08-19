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

  const COMPOSITION = {...LIPID_COMPOSITION,...SOLUTION_COMPOSITION}
  const infoFile = {...filteredData,COMPOSITION}
  return infoFile; 
}