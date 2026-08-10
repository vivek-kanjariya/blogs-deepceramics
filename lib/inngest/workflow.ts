import { Engine } from "@inngest/workflow-kit";
import { loadWorkflow } from "../loaders/workflow";
import { inngest } from "./client";
import { actionsWithHandlers } from "./workflowActionHandlers";

// Log available actions
console.log("Available action handlers:", actionsWithHandlers.map(a => a.kind));

const workflowEngine = new Engine({
  actions: actionsWithHandlers,
  loader: loadWorkflow,
});

export default inngest.createFunction(
  { 
    id: "blog-post-workflow",
    name: "Blog Post Automation",
    // ✅ Triggers go INSIDE the first argument object
    triggers: [
      { event: "blog-post.updated" },
      { event: "blog-post.published" }
    ],
    // Cancel on - if you want to keep this, it also goes here
    cancelOn: [
      {
        event: "blog-post.reject-ai-suggestions",
        if: "async.data.id == event.data.id",
        timeout: "1d"
      }
    ]
  },
  // ✅ Handler is now the SECOND argument
  async ({ event, step }) => {
    try {
      console.log("Workflow triggered by event:", event.name);
      
      const workflow = await loadWorkflow(event);
      
      if (!workflow) {
        console.log("No workflow found for event:", event.name);
        return;
      }

      if (!workflow.actions || workflow.actions.length === 0) {
        console.log("Workflow has no actions");
        return;
      }
      
      console.log("Running workflow with actions:", workflow.actions);
      await workflowEngine.run({ event, step, workflow });
      
    } catch (error: unknown) {
      console.error("Error running workflow:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
);