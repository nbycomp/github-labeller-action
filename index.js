const core = require('@actions/core');
const github = require('@actions/github');

function parseLabel(fullBranchRef) {
  const branch = fullBranchRef.replace('refs/heads/', '');
  const parts = branch.split("/", 2);
  if (parts.length > 1) {
    return parts[0];
  }
  return "";
}

async function run(octokit, label, repository, issue_number) {
  try {
    const [owner, repo] = repository.split("/", 2);

    const { data: labels } = await octokit.rest.issues.listLabelsForRepo({
      owner,
      repo
    });

    for (let i = 0; i < labels.length; i++) {
      if (label == labels[i].name) {
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number,
          labels: [label]
        });
        core.setOutput("label", label);
        break;
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

try {
  const label = parseLabel(process.env.GITHUB_REF);

  const token = core.getInput('token');
  const octokit = github.getOctokit(token);

  const repo = process.env.GITHUB_REPOSITORY;
  const issue_number = core.getInput('issue_number');

  run(octokit, label, repo, issue_number);
} catch (error) {
  core.setFailed(error.message);
}
