import { getInput, setFailed } from "@actions/core";
import { Cloudflare } from "cloudflare";

async function deleteDeployment({
  apiToken,
  projectName,
  accountId,
  branchName,
}: {
  apiToken: string;
  projectName: string;
  accountId: string;
  branchName: string;
}) {
  const cloudflare = new Cloudflare({
    apiToken,
  });

  const deployments = await cloudflare.pages.projects.deployments.list(
    projectName,
    { account_id: accountId },
  );

  const deleteSet = new Set<string>();

  for (const deployment of deployments.result) {
    if (
      deployment.id &&
      deployment.deployment_trigger?.metadata?.branch === branchName
    ) {
      deleteSet.add(deployment.id);
    }
  }

  await Promise.all(
    Array.from(deleteSet).map((id) =>
      cloudflare.pages.projects.deployments.delete(projectName, id, {
        account_id: accountId,
      }),
    ),
  );
}

async function runAction() {
  try {
    const accountId = getInput("account_id", { required: true });
    const apiToken = getInput("api_token", { required: true });
    const branchName = getInput("branch_name", { required: true });
    const projectName = getInput("project_name", { required: true });

    await deleteDeployment({ apiToken, projectName, accountId, branchName });
  } catch (error: unknown) {
    // Fail the action with the error message
    if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}

void runAction();
