const core = require("@actions/core");
const github = require("@actions/github");

function parseLabel(fullBranchRef) {
  const branch = fullBranchRef.replace("refs/heads/", "");
  const parts = branch.split("/", 2);
  if (parts.length > 1) {
    return parts[0];
  }
  return "";
}

async function run() {
  try {
    const {
      number: issue_number,
      head: {
        ref,
        repo: {
          name: repo,
          owner: { login: owner },
        },
      },
    } = github.context.payload.pull_request;

    const label = parseLabel(ref);
    if (!label) {
      console.log(`no label found in branch name: ${ref}`);
      return;
    }

    const token = core.getInput("token");
    const octokit = github.getOctokit(token);

    const { data: labels } = await octokit.rest.issues.listLabelsForRepo({
      owner,
      repo,
    });

    for (let i = 0; i < labels.length; i++) {
      if (label == labels[i].name) {
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number,
          labels: [label],
        });
        core.setOutput("label", label);
        return;
      }
    }
    console.log(`no labels in repo matched label: ${label}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
