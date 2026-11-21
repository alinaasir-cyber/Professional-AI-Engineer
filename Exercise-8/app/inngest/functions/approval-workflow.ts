import { inngest } from "../client";

interface InitialRequest {
  requestId: string;
  action: string;
  requestedBy: string;
  status: string;
  requestedAt: string;
}

// 2.3 Wait for Event: step.waitForEvent() - Approval Workflow
export const approvalWorkflow = inngest.createFunction(
  { id: "approval-workflow", name: "Approval Workflow (Human-in-the-Loop)" },
  { event: "approval/requested" },
  async ({ event, step }) => {
    const requestId: string = (event.data?.requestId as string) || `req_${Date.now()}`;
    const action: string = (event.data?.action as string) || "Release AI Model To Production";
    const requestedBy: string = (event.data?.requestedBy as string) || "AI Agent Researcher";

    // Step 1: Initiate request and log details
    const initialRequest: InitialRequest = await step.run("initiate-request", async (): Promise<InitialRequest> => {
      return {
        requestId,
        action,
        requestedBy,
        status: "WAITING_APPROVAL",
        requestedAt: new Date().toISOString(),
      };
    });

    // Step 2: Pause and wait for human decision event
    const approvalResponse = await step.waitForEvent("wait-for-human-approval", {
      event: "approval/responded",
      timeout: "24h",
      match: "data.requestId", // Correlates using the unique requestId
    });

    // Step 3: Execute decision
    const finalResult = await step.run("finalize-approval-decision", async () => {
      if (!approvalResponse) {
        return {
          requestId,
          action: initialRequest.action,
          status: "TIMED_OUT",
          message: "Request timed out waiting for human approval after 24 hours.",
        };
      }

      const isApproved = approvalResponse.data?.approved === true;
      return {
        requestId,
        action: initialRequest.action,
        status: isApproved ? "APPROVED" : "REJECTED",
        approved: isApproved,
        approver: (approvalResponse.data?.approver as string) || "Human Reviewer",
        comments:
          (approvalResponse.data?.comments as string) ||
          (isApproved ? "Approved by supervisor." : "Rejected by supervisor."),
        decidedAt: new Date().toISOString(),
      };
    });

    return finalResult;
  }
);
