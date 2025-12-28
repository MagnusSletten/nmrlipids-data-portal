export default function CompositionInfo(){
    return (
      <>
    <h3>System Composition</h3>
    <div className="composition-info">
      <details>
        <summary>
        More information about <i>Membrane Composition</i> and <i>Solution Composition</i>
        </summary>
        <p>
          <b>Composition</b> Each entry includes, in order:
        </p>
        
        <ul>
        <li>
            <code>Universal Molecule Name</code>: defined by the NMRlipids project and {" "}
            <a
            href="https://nmrlipids.github.io/FAIRMD_lipids/stable/schemas/moleculesAndMapping.html#molecule-names"
            target="_blank"
            rel="noopener noreferrer"
            >
            listed here
            </a>.
        </li>
        <li>
        <code>NAME</code>: the molecule’s simulation-specific residue name
        (usually easiest to check in the <code>.gro</code> file)
      </li>
        <li>
            <code>MAPPING</code>: the mapping file for the molecule
        </li>
        </ul>
        <p>
          Details and examples:{" "}
          <a
            href="https://nmrlipids.github.io/FAIRMD_lipids/stable/schemas/simulation_metadata.html#fields-description"
            target="_blank"
            rel="noopener noreferrer"
          >
            Simulation metadata – COMPOSITION
          </a>
          .
        </p>

        <p>
          <b>Mapping files</b> connect <i>universal atom names</i> to {" "}
          <i>simulation-specific atom/residue names</i>. This lets the databank
          run the same analyses across simulations that use different naming
          schemes. More info here:{" "}
          <a
            href="https://nmrlipids.github.io/FAIRMD_lipids/stable/schemas/moleculesAndMapping.html#universal-atom-names-in-mapping-files"
            target="_blank"
            rel="noopener noreferrer"
          >
            Universal molecule & atom names
          </a>
          {". "}See mapping files for membranes here: {" "}
            <a
            href="https://github.com/NMRLipids/BilayerData/tree/main/Molecules/membrane"
            target="_blank"
            rel="noopener noreferrer"
          >
            Membrane mapping files
          </a>
          .
        </p>
      </details>
    </div>
  </>
    )}