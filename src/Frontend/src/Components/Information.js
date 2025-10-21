export default function Information() {
  return (
    <>
      <h2>Information</h2>

      <p>
        This website allows uploads of new simulation information to the NMRlipids BilayerData repository.
      </p>

      <h2>How it Works</h2>
      <ol>
        <li>
          <strong>Upload:</strong> Use the upload form to submit your simulation files.
        </li>
        <li>
          <strong>Pull Request:</strong> When the upload is complete, a pull request (PR) will be created automatically in the BilayerData repository. A link to this PR will appear at the bottom of this page.
        </li>
        <li>
          <strong>Verification:</strong> Admins might make small adjustments, such as fixing mapping file names or other BilayerData-specific details depending on automatic tests of the simulation.
        </li>
        <li>
          <strong>Processing:</strong> After verification, your simulation will be processed and added to the BilayerData.
        </li>
      </ol>

      <h2>More on GitHub</h2>
      <p>
        Uploads are handled through GitHub, and you will need to log in with your GitHub account to access the upload portal. Authentication is used only to verify your identity; no additional setup is required.
      </p>
      <p>
       Using your GitHub account, you can comment directly on your pull request if you wish. Admins may also leave a short comment there if something needs clarification or if small adjustments were made before processing.
      </p>
    </>
  );
}
