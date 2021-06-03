const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const inputLabels = core.getInput("labels");
    const allowedLabels = inputLabels
      .split(",")
      .map((l) => l.trim())
      .filter((r) => r);
    const token = core.getInput("token");
    if (!token) {
      core.setFailed('Missing input: "token"');
      return;
    }

    const octokit = github.getOctokit(token);

    if (allowedLabels.length === 0) {
      core.setFailed('Missing input: "labels"');
      return;
    }

    const {
      number: issue_number,
      head: {
        ref,
        repo: {
          name: repo,
          owner: { login: owner },
        },
      },
      labels: currentPullLabels,
    } = github.context.payload.pull_request;

    const { data: availableRepositoryLabels } =
      await octokit.rest.issues.listLabelsForRepo({
        owner,
        repo,
      });

    const parts = ref.split("/", 2);
    const labelFromBranch = parts.length > 1 ? parts[0] : null;

    if (labelFromBranch) {
      console.log(`Label from branch found: ${labelFromBranch}.`);

      const availableRepoLabels = new Set(
        availableRepositoryLabels.map((l) => l.name)
      );

      if (availableRepoLabels.has(labelFromBranch)) {
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number,
          labels: [labelFromBranch],
        });
        core.setOutput("branch-label", labelFromBranch);
        console.log(`Applied label to Pull Request: ${labelFromBranch}.`);
      } else {
        console.log(`Label not available: ${labelFromBranch}.`);
      }
    } else {
      console.log(`No label found in branch name: ${ref}`);
    }

    const appliedLabels = new Set(currentPullLabels.map((l) => l.name));
    if (labelFromBranch) {
      appliedLabels.add(labelFromBranch);
    }

    const labelsInList = [...allowedLabels].filter((label) =>
      appliedLabels.has(label)
    );
    if (!labelsInList.length) {
      core.setFailed("None of the required labels were found.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
