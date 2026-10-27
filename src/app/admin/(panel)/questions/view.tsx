import { QuestionManager } from "@/components/AdminBuilders";
import { getRepo } from "@/lib/repo";

export async function AdminQuestionsView() {
  const qs = await getRepo().listWizardQuestions();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Wizard questions</h1>
      <p className="text-sm text-muted">Extra questions shown on the public “Find your visa options” form, just before the visitor saves their details. Answers appear next to each lead. Do not ask for passport, CNIC, or bank details here.</p>
      <QuestionManager initial={qs} />
    </div>
  );
}
