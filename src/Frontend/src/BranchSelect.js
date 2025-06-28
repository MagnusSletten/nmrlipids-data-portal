import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataRepo = "MagnusSletten/BilayerData"

function BranchSelect({ selectedBranch, setSelectedBranch, setMessage }) {  
  const [branches, setBranches] = useState([]); 

  useEffect(() => {
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
        setMessage("Failed to load branches."); // 
      }
    };

    fetchBranches();
  }, [setSelectedBranch, setMessage]); 

  return (
    <>
      <p className="dropdown-label"> Select a branch to upload to:</p>
      <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="branch-select">
        {branches.map(branch => (
          <option key={branch} value={branch}>{branch}</option>
        ))}
      </select>
    </>
  );
}

export default BranchSelect;

