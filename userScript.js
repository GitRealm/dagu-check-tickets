// Node.js script to validate commits and PR compliance, designed for execution via encapsulated script

const axios = require('axios');

// Listen for messages from the encapsulation script
process.on('message', async (message) => {
    if (message.action === 'execute') {
        console.log('Received Inputs:', message.inputs);
        const inputs = message.inputs;
        console.log('Received Inputs:', inputs);

        try {
            const { baseRef, headRef, owner, repo, githubToken } = inputs;

            if (!baseRef || !headRef || !owner || !repo || !githubToken) {
                throw new Error('Missing required inputs: baseRef, headRef, owner, repo, or githubToken');
            }

            const results = await validateCommits(baseRef, headRef, owner, repo, githubToken);

            process.send({ action: 'result', data: results });
        } catch (error) {
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
        console.log(`Validating commits between ${baseRef} and ${headRef} for ${owner}/${repo}...`);

        // Simulate fetching commits (replace with actual Git commands if needed)
        const commits = ['commit1', 'commit2']; // Replace with dynamic fetching logic

        console.log(`Found ${commits.length} commits.`);

        const results = [];
        for (const commit of commits) {
            console.log(`Validating commit: ${commit}`);
            const pr = await getPullRequestForCommit(commit, owner, repo, githubToken);

            if (pr) {
                console.log(`Commit ${commit} is associated with PR #${pr.number}. Validating PR compliance...`);
                const compliance = await validatePullRequestCompliance(pr);
                results.push({ commit, prNumber: pr.number, compliance });
            } else {
                console.warn(`Commit ${commit} is not linked to a Pull Request. Compliance failed.`);
                results.push({ commit, prNumber: null, compliance: false });
            }
        }

        return results;
    } catch (error) {
        throw new Error(`Validation failed: ${error.message}`);
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
        const url = `https://api.github.com/repos/${owner}/${repo}/commits/${commit}/pulls`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github.groot-preview+json',
            },
        });

        return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
        console.error(`Error fetching PR for commit ${commit}:`, error.message);
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

        console.log(`PR #${number} passed compliance checks.`);
        return true;
    } catch (error) {
        console.error(`Error validating PR #${pr.number}:`, error.message);
        return false;
    }
}
