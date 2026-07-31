"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, MapPin, Calendar } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateRange } from "@/lib/utils";
import type { Training } from "@/types";

type TrainingWithCount = Training & { participants: { count: number }[] };

export default function TrainingsListPage() {
  const [trainings, setTrainings] = useState<TrainingWithCount[] | null>(null);

  useEffect(() => {
    fetch("/api/trainings")
      .then((res) => res.json())
      .then((data) => setTrainings(data.trainings || []));
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos formations et leurs participants
          </p>
        </div>
        <Link href="/admin/trainings/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nouvelle formation
          </Button>
        </Link>
      </div>

      {trainings === null && (
        <p className="text-sm text-gray-500">Chargement…</p>
      )}

      {trainings?.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center text-sm text-gray-500">
            Aucune formation pour le moment.{" "}
            <Link href="/admin/trainings/new" className="font-medium text-brand-600">
              Créer la première
            </Link>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainings?.map((training) => (
          <Link key={training.id} href={`/admin/trainings/${training.id}`}>
            <Card className="h-full transition-shadow hover:shadow-lg">
              <CardBody>
                <h3 className="mb-1 font-semibold text-gray-900 line-clamp-2">
                  {training.title}
                </h3>
                <p className="mb-4 text-sm text-gray-500 line-clamp-1">
                  {training.organizer}
                </p>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateRange(training.start_date, training.end_date)}
                  </div>
                  {training.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {training.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {training.participants?.[0]?.count ?? 0} participant(s)
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
