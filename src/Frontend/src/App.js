import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import BranchSelect from './BranchSelect';
import { useImmer } from 'use-immer';
import CompositionEditor from './CompositionEditor';
import ScalarFields    from './ScalarFields';
import fieldConfig from './FieldConfig';
import UnitedAtomDictEditor from './UnitedAtomDictEditor';


export default function App() {
  const OAUTH_ClientID = process.env.REACT_APP_OAUTH_CLIENT_ID;
  const DataRepo = process.env.REACT_APP_DATA_REPO;
  const GITHUB_GATEWAY_PATH = '/app/';
  const API_PATH = '/api/';

  const [loggedIn, setLoggedIn] = useState(false);
  const [adminStatus, setAdminStatus] = useState(
  localStorage.getItem('adminStatus') === 'true'
);
  const [loggedInMessage, setLoggedInMessage] = useState(null);
  const [userName, setUserName] = useState('');
  const [branch, setBranch] = useState('main');
  const [message, setMessage] = useState('Fill in the form');
  const [pullRequestUrl, setPullRequestUrl] = useState(null);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [moleculeList, setMoleculeList] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const mappingDict = JSON.parse(
  localStorage.getItem('mappingDict') || '{}'
);

// Fetch the up‐to‐date molecule list on mount:
 useEffect(() => {
    axios.get(`${API_PATH}molecules`)
      .then(res => setMoleculeList(res.data))
      .catch(err => console.error("Failed to load molecules:", err));
  }, []);
// Fetch mapping files on mount
useEffect(() => {
  axios.get(`${API_PATH}mapping-files`)
    .then(res => {
      localStorage.setItem('mappingDict', JSON.stringify(res.data)); 
    })
    .catch(err => console.error("Failed to load mappings:", err));
}, []);  

// Function to update databank files:
const updateDatabankFiles = async () => {
  try {
    await axios.post(
      `${API_PATH}refresh-databank-files`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.githubToken}` } }
    );
    setRefreshMessage('Databank files updated successfully');
    // re-fetch updated lists
    const resp = await axios.get(`${API_PATH}molecules`);
    setMoleculeList(resp.data);
    // re-fetch mapping file lists
   axios.get(`${API_PATH}mapping-files`)
    .then(res => {
      localStorage.setItem('mappingDict', JSON.stringify(res.data)); 
    })
    .catch(err => console.error("Failed to load mappings:", err));  
  } catch (err) {
    if (err.response?.status === 403) {
      setRefreshMessage('Not authorized to refresh databank files');
    } else {
      setRefreshMessage('Refresh failed');
    }
  }
}; 
// Contains data for the form 
const [data, setData] = useImmer({
  DOI: null,
  TRJ: null,
  TPR: null,
  SOFTWARE: null,
  PREEQTIME: null,
  TIMELEFTOUT: null,
  UNITEDATOM_DICT: {},
  TYPEOFSYSTEM: null,
  TEMPERATURE: null,
  SYSTEM: null,
  PUBLICATION: null,
  AUTHORS_CONTACT: null,
  SOFTWARE_VERSION: null,
  FF: null,
  FF_SOURCE: null,
  FF_DATE: null,
  CPT: null,
  LOG: null,
  TOP: null,
  GRO: null,
  EDR: null,
  COMPOSITION: {}
});

// Method to handle changes in form fields:
const handleChange = e => {
  const { name, value } = e.target;
  const { type, trim } = fieldConfig[name];
  let val = value;
  if (trim) val = val.trim();
  let parsed = val;
  if (type === 'integer') parsed = val === '' ? '' : parseInt(val, 10);
  else if (type === 'float') parsed = val === '' ? '' : parseFloat(val);
  setData(draft => { draft[name] = parsed; });
};


// Handles process after url has been redirected back from Github:
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (localStorage.githubToken) {
    setLoggedIn(true);
    setLoggedInMessage(`Logged in as ${localStorage.username}`);
    return;
  }
  if (code) {
    axios.post(`${GITHUB_GATEWAY_PATH}verifyCode`, { code })
      .then(res => {
        if (res.data.authenticated) {
          const { token, username, admin_status } = res.data;
          localStorage.githubToken = token;
          localStorage.username   = username;
          localStorage.setItem('adminStatus', admin_status.toString());
          setAdminStatus(admin_status)
          setLoggedIn(true);
          setLoggedInMessage(`Logged in as ${username}`);
          setAdminStatus(admin_status);     
          window.history.replaceState(null, '', window.location.pathname);
        }
      })
      .catch(() => setMessage('GitHub login failed'));
  }
}, []);
// Starts login process:
  const githubLogin = () => {
    window.location.assign(`https://github.com/login/oauth/authorize/?client_id=${OAUTH_ClientID}`);
  };
// Handles logout process:
  const handleLogout = () => {
    localStorage.clear();
    setLoggedIn(false);
    setAdminStatus(false)
    setLoggedInMessage(null);
    setMessage('Fill in the form');
    setUserName('');
    setBranch('main');
    setPullRequestUrl(null);
    setUploadStatus(null);
    setData(draft => {
      Object.keys(fieldConfig).forEach(key => {
        draft[key] = null;
      });
      draft.COMPOSITION = {};
    }); 
  }
    
// Handles form submission:
const handleSubmit = async e => {
  e.preventDefault();
  // Removes null or empty values from data object:
  const filteredData = Object.fromEntries(
  Object.entries(data).filter(([_, v]) => {
    if (v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)
      return false;
    return true;
  })
  );
  // Creates JSON payload from data
  const jsonPayload = {
    ...filteredData,
    userName,
    branch
  };

  setUploadStatus('Uploading data…');

  try {
    const resp = await axios.post('/app/upload', jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.githubToken}`
      }
    });

    setUploadStatus('Upload succeeded!');
    
    if (resp.data.pullUrl) {
      setPullRequestUrl(resp.data.pullUrl);
    }

  } catch (err) {
    const errorMsg = err.response?.data?.error ?? err.message;
    console.error('Upload error', err.response?.status, err.response?.data || err);
    setUploadStatus(`Upload failed: ${errorMsg}`);
  }
};

return (
  <div className="Container">
    <div className="Left">
      {loggedIn && adminStatus && (
        <div className="Admin-panel">
          <h3> Administration panel </h3>
          <div className="refresh-panel">
            <button onClick={updateDatabankFiles} className="button secondary">
              Update databank files
            </button>
            {refreshMessage && <p className="centered">{refreshMessage}</p>}
          </div>
        </div>
      )}
    </div>

    <div className="App">
      <header className="App-header">
        <h1>Welcome to the NMRLipids Upload Portal</h1>
      </header>
          {!loggedIn && (
       <> 
        <button
            onClick={githubLogin}
            className="button centered"
          >
            GitHub Login
          </button>
         <h3>Information</h3>
         <div className="info-block">
         <p>Please log in with GitHub to upload data.</p>
         <p>GitHub login is currently used as a way to authenticate users and reduce spam.</p>
         <p>The login process authorizes the app to access your public information, specifically your username. Nothing else.</p>
        </div>
        </>
      )}

      {loggedIn && (
        <>
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            className="name-input centered"
          />
          <BranchSelect
            selectedBranch={branch}
            setSelectedBranch={setBranch}
            setMessage={setMessage}
            DataRepo={DataRepo}
          />
          {message && <p className="status-message-centered">Status: {message}</p>}

          <form onSubmit={handleSubmit} className="upload-form">
              <ScalarFields
                data={data}
                onChange={handleChange}
                fieldConfig={fieldConfig}
                />
              <UnitedAtomDictEditor data={data} setData={setData} />

              <CompositionEditor
                options={moleculeList}
                mappingDict={mappingDict}  
                composition={data.COMPOSITION}
                setComposition={recipe =>
                  setData(draft => {
                    recipe(draft.COMPOSITION);
                  })
                }
              />
              <div className="submit-row">
                <button type="submit" className="button">
                  Submit
                </button>
                {uploadStatus && (
                <p className="upload-status" style={{ marginRight: '1em' }}>
                  {uploadStatus}
                </p>
              )}
                {pullRequestUrl && (
                  <a
                    href={pullRequestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button"
                  >View Pull Request</a>
                )}
              </div>
          </form>
                {/* Simple text link to docs */}
         <p className="docs-link">
          View full documentation on{' '}
          <a
            href="https://nmrlipids.github.io/READMEcontent.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Pages
          </a>.
        </p>
        </>
      )}
    </div>

<div className="Right">
  {loggedIn && (
    <button onClick={handleLogout} className="button secondary">
      Logout
    </button>
  )}
    {loggedIn && loggedInMessage && (
   <p className="user-info">{loggedInMessage}</p>
   )}

</div>
</div>
);
}