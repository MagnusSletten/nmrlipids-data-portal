import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import logo from './logo.svg';
import BranchSelect from './BranchSelect';
import Description from './Description';
import { useImmer } from 'use-immer';
import CompositionEditor from './CompositionEditor';
import ScalarFields    from './ScalarFields';

// Scalar fields
const scalarFields = [
  'DOI','SOFTWARE','TRJ','TPR','PREEQTIME','TIMELEFTOUT','DIR_WRK',
  'UNITEDATOM_DICT','TYPEOFSYSTEM','SYSTEM','PUBLICATION','TEMPERATURE','AUTHORS_CONTACT',
  'BATCHID','SOFTWARE_VERSION','FF','FF_SOURCE','FF_DATE','CPT','LOG','TOP','GRO','EDR',
];


export default function App() {
  const ClientID = 'Ov23liS8svKowq4uyPcG';
  const IP = '/app/';

  /* Auth & User */
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminStatus, setAdminStatus] = useState(
  localStorage.getItem('adminStatus') === 'true'
);
  const [loggedInMessage, setLoggedInMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [branch, setBranch] = useState('main');
  const [message, setMessage] = useState('Fill in the form');
  const [pullRequestUrl, setPullRequestUrl] = useState(null);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [compositionList, setCompositionList] = useState([]);

  // Fetch the up‐to‐date molecule list on mount
  useEffect(() => {
    axios.get(`${IP}molecules`)
      .then(res => setCompositionList(res.data))
      .catch(err => console.error("Failed to load molecules:", err));
  }, []);

const updateComposition = async () => {
  try {
    await axios.post(
      `${IP}refresh-composition`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.githubToken}` } }
    );
    setRefreshMessage('Composition list updated successfully');
    // re-fetch updated list
    const resp = await axios.get(`${IP}molecules`);
    setCompositionList(resp.data);
  } catch (err) {
    if (err.response?.status === 403) {
      setRefreshMessage('Not authorized');
    } else {
      setRefreshMessage('Refresh failed');
    }
  }
  };


const [data, setData] = useImmer({
  DOI: null,
  TRJ: null,
  TPR: null,
  SOFTWARE: null,
  PREEQTIME: null,
  TIMELEFTOUT: null,
  DIR_WRK: null,
  UNITEDATOM_DICT: null,
  TYPEOFSYSTEM: null,
  TEMPERATURE: null,
  SYSTEM: null,
  PUBLICATION: null,
  AUTHORS_CONTACT: null,
  BATCHID: null,
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

// 1) change any scalar
const handleChange = e => {
  const { name, value } = e.target;
  setData(draft => { draft[name] = value.trimEnd() });
};



useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (localStorage.githubToken) {
    setLoggedIn(true);
    setLoggedInMessage(`Logged in as ${localStorage.username}`);
    return;
  }
  if (code) {
    axios.post(`${IP}verifyCode`, { code })
      .then(res => {
        if (res.data.authenticated) {
          const { token, username, admin_status } = res.data;
          localStorage.githubToken = token;
          localStorage.username   = username;
          localStorage.adminStatus = adminStatus; 
          setLoggedIn(true);
          setLoggedInMessage(`Logged in as ${username}`);
          setAdminStatus(admin_status);     
          window.history.replaceState(null, '', window.location.pathname);
        }
      })
      .catch(() => setMessage('GitHub login failed'));
  }
}, []);

  const githubLogin = () => {
    window.location.assign(`https://github.com/login/oauth/authorize/?client_id=${ClientID}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    setLoggedIn(false);
    setAdminStatus(false)
    setLoggedInMessage('');
    setMessage('Fill in the form');
    setUserName('');
    setBranch('main');
    setPullRequestUrl(null);
    setData({
    DOI: '', SOFTWARE: '',TRJ: '',TPR: '',PREEQTIME: 0,TIMELEFTOUT: 0,DIR_WRK: '', UNITEDATOM_DICT: '', TYPEOFSYSTEM: '',
    SYSTEM: '', PUBLICATION: '',AUTHORS_CONTACT: '', BATCHID: '', SOFTWARE_VERSION: '', FF: '', FF_SOURCE: '',
    FF_DATE: '', CPT: '', LOG: '', TOP: '', EDR: '', COMPOSITION: {}
    });
  };



const handleSubmit = async e => {
  e.preventDefault();

  const jsonPayload = {
    ...data,
    userName,
    branch
  };

  console.log( 'Sending payload:', jsonPayload);

  try {
    const resp = await axios.post('/app/upload', jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.githubToken}`
      }
    });
    console.log('Upload succeeded:', resp.data);
    setMessage('Upload succeeded!');
    if (resp.data.pullUrl) {
     setPullRequestUrl(resp.data.pullUrl);
    }
  } catch (err) {
    if (err.response) {
      console.error('Server responded with:', err.response.status, err.response.data);
      setMessage(`Upload failed: ${err.response.data.error}`);
    } else {
      console.error('Network or other error', err);
      setMessage(`Upload failed: ${err.message}`);
    }
  }
};

return (
  <div className="Container">
    <div className="Left">
      {loggedIn && localStorage.adminStatus && (
        <div className="Admin-panel">
          <h3> Administration panel </h3>
          <div className="refresh-panel">
            <button onClick={updateComposition} className="button secondary">
              Update lipid list
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
          />
          {message && <p className="status-message-centered">Status: {message}</p>}

          <form onSubmit={handleSubmit} className="upload-form">
            <ScalarFields
              fields={scalarFields}
              data={data}
              onChange={handleChange}
            />

            <CompositionEditor
              options={compositionList}
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

              {pullRequestUrl && (
                <a
                  href={pullRequestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                >
                  View Pull Request
                </a>
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
  <Description />

  
</div>
</div>
);
}