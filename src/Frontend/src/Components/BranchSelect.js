import { useState, useEffect } from 'react';
import axios from 'axios';

function BranchSelect({ selectedBranch, setSelectedBranch, setMessage, DataRepo }) {  
  const [branches, setBranches] = useState([]); 

  const DEV_MODE = process.env.REACT_APP_DEV_MODE === 'TRUE';

  useEffect(() => {
    if (!DEV_MODE) return; 

    const fetchBranches = async () => {
      try {
        const response = await axios.get(`https://api.github.com/repos/${DataRepo}/branches`);
        const branchNames = response.data.map(branch => branch.name);
        setBranches(branchNames);

        if (branchNames.includes("main")) {
          setSelectedBranch("main");
        } else if (branchNames.length > 0) {
          setSelectedBranch(branchNames[0]);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setMessage("Failed to load branches.");
      }
    };

    fetchBranches();
  },  [DataRepo, DEV_MODE]);

  if (!DEV_MODE) return null;

  return (
    <>
      <p className="dropdown-label">Select a branch to upload to:</p>
      <select
        value={selectedBranch}
        onChange={e => setSelectedBranch(e.target.value)}
        className="branch-select"
      >
        {branches.map(branch => (
          <option key={branch} value={branch}>
            {branch}
          </option>
        ))}
      </select>
    </>
  );
}

export default BranchSelect;
