const axios = require('axios');

// Listen for messages from the encapsulation script
process.on('message', async (message) => {
    if (message.action === 'execute') {
        console.info('Received action: execute. Processing inputs...');
        const inputs = message.inputs;

        try {
            const { baseRef, headRef, owner, repo, githubToken } = inputs;

            // Validate required inputs
            if (!baseRef || !headRef || !owner || !repo || !githubToken) {
                throw new Error('Missing required inputs: baseRef, headRef, owner, repo, or githubToken');
            }

            console.info(`Starting validation for repository: ${owner}/${repo}`);
            const results = await validateCommits(baseRef, headRef, owner, repo, githubToken);

            console.info('Validation complete. Sending results back to the parent process.');
            process.send({ action: 'result', data: results });
        } catch (error) {
            console.error('Error during execution:', error.message);
            process.send({ action: 'error', error: error.message });
        }
    }
});

/**
 * Validate commits between two references.
 * @param {string} baseRef - Base reference (e.g., a branch or tag).
 * @param {string} headRef - Head reference (e.g., a branch or tag).
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {string} githubToken - GitHub token for authentication.
 * @returns {Promise<Array>} - Validation results.
 */
async function validateCommits(baseRef, headRef, owner, repo, githubToken) {
    try {
        console.info(`Fetching commits between ${baseRef} and ${headRef} for ${owner}/${repo}...`);

        // Simulate fetching commits (replace with actual logic to fetch commits)
        const commits = ['commit1', 'commit2']; // Replace with dynamic fetching logic
        console.info(`Found ${commits.length} commits.`);

        const results = [];
        for (const commit of commits) {
            console.info(`Processing commit: ${commit}`);
            const pr = await getPullRequestForCommit(commit, owner, repo, githubToken);

            if (pr) {
                console.info(`Commit ${commit} is linked to PR #${pr.number}. Checking compliance...`);
                const compliance = await validatePullRequestCompliance(pr);
                results.push({ commit, prNumber: pr.number, compliance });
                console.info(`Compliance check for commit ${commit} completed: ${compliance ? 'PASS' : 'FAIL'}`);
            } else {
                console.warn(`Commit ${commit} is not linked to any Pull Request. Marking as non-compliant.`);
                results.push({ commit, prNumber: null, compliance: false });
            }
        }

        return results;
    } catch (error) {
        console.error(`Error during validation: ${error.message}`);
        throw error;
    }
}

/**
 * Fetch the pull request associated with a commit.
 * @param {string} commit - Commit hash.
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {string} githubToken - GitHub token for authentication.
 * @returns {Promise<Object|null>} - PR data or null if no PR is found.
 */
async function getPullRequestForCommit(commit, owner, repo, githubToken) {
    try {
        console.info(`Fetching pull request for commit: ${commit}`);
        const url = `https://api.github.com/repos/${owner}/${repo}/commits/${commit}/pulls`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github.groot-preview+json',
            },
        });

        if (response.data.length > 0) {
            console.info(`Pull request found for commit ${commit}: PR #${response.data[0].number}`);
            return response.data[0];
        } else {
            console.warn(`No pull request linked to commit ${commit}.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching pull request for commit ${commit}: ${error.message}`);
        return null;
    }
}

/**
 * Validate PR compliance.
 * @param {Object} pr - Pull Request data.
 * @returns {boolean} - True if PR is compliant, false otherwise.
 */
async function validatePullRequestCompliance(pr) {
    try {
        console.info(`Validating compliance for PR #${pr.number}`);
        const { number, title, body, state, merged } = pr;

        // Compliance checks
        if (state !== 'closed' || !merged) {
            console.warn(`PR #${number} is not merged or closed.`);
            return false;
        }

        if (!title || !body) {
            console.warn(`PR #${number} is missing a title or description.`);
            return false;
        }

        console.info(`PR #${number} passed compliance checks.`);
        return true;
    } catch (error) {
        console.error(`Error validating compliance for PR #${pr.number}: ${error.message}`);
        return false;
    }
}
