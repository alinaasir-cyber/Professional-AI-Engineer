import { inngest } from "../client";

interface RecordItem {
  id: string;
  name: string;
  rating: number;
  category: string;
}

interface ProcessedRecordItem extends RecordItem {
  status: string;
  sentiment: string;
  requiresReview: boolean;
}

// 2.1b Multi-Step: step.run() - Three Steps
export const dataProcessor = inngest.createFunction(
  { id: "data-processor", name: "Multi-step Data Processor" },
  { event: "data/process" },
  async ({ event, step }) => {
    // Step 1: Fetch data
    const fetchedData = await step.run("fetch-data", async () => {
      const source = (event.data?.source as string) || "api";
      const records: RecordItem[] = [
        { id: "item_1", name: "Customer Feedback #1", rating: 5, category: "Support" },
        { id: "item_2", name: "System Log Error #404", rating: 2, category: "Infra" },
        { id: "item_3", name: "AI Agent Response Evaluation", rating: 4, category: "AI" },
      ];
      return {
        source,
        records,
        fetchedAt: new Date().toISOString(),
      };
    });

    // Step 2: Transform / Process data (using Step 1 output)
    const processedData = await step.run("transform-data", async () => {
      const transformed: ProcessedRecordItem[] = fetchedData.records.map((item: RecordItem) => ({
        ...item,
        status: "processed",
        sentiment: item.rating >= 4 ? "Positive" : "Negative",
        requiresReview: item.rating < 3,
      }));

      return {
        source: fetchedData.source,
        total: transformed.length,
        items: transformed,
        reviewNeededCount: transformed.filter((x: ProcessedRecordItem) => x.requiresReview).length,
      };
    });

    // Step 3: Summarize and save (using Step 2 output)
    const finalSummary = await step.run("summarize-and-save", async () => {
      return {
        success: true,
        source: processedData.source,
        summary: `Processed ${processedData.total} items from source: ${processedData.source}. Flagged ${processedData.reviewNeededCount} items for human review.`,
        completedAt: new Date().toISOString(),
        results: processedData.items,
      };
    });

    return finalSummary;
  }
);
