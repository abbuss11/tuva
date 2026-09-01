import { TrainingForm } from "@/components/admin/TrainingForm";

export default function NewTrainingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="kicker mb-1.5">Nouvelle formation</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Créer une formation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Renseignez les informations de la formation
        </p>
      </div>
      <TrainingForm />
    </div>
  );
}
