"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Users, Award, Download, Plus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DashboardStats } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const cards = [
    {
      label: "Formations",
      value: stats?.trainingsCount,
      icon: GraduationCap,
      color: "bg-brand-50 text-brand-600",
    },
    {
      label: "Participants",
      value: stats?.participantsCount,
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Attestations",
      value: stats?.certificatesCount,
      icon: Award,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Téléchargements",
      value: stats?.totalDownloads,
      icon: Download,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">
            Vue d&apos;ensemble de vos formations et attestations
          </p>
        </div>
        <Link href="/admin/trainings/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nouvelle formation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardBody className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value ?? "—"}
                </p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Commencer</h2>
            <p className="mt-1 text-sm text-gray-500">
              Créez une formation, ajoutez des participants, et TUVA génère
              automatiquement leurs attestations téléchargeables.
            </p>
          </div>
          <Link href="/admin/trainings">
            <Button variant="secondary">Voir les formations</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
