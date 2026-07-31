import { TrainingForm } from "@/components/admin/TrainingForm";

export default function NewTrainingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle formation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Renseignez les informations de la formation
        </p>
      </div>
      <TrainingForm />
    </div>
  );
}
