import { Suspense } from "react";
import { TrainingPageContent } from "./training-page-content";

export default function TrainingPage() {
  return (
    <Suspense fallback={null}>
      <TrainingPageContent />
    </Suspense>
  );
}
