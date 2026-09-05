"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Users, Award, Download, Plus, ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/admin/StatCard";
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
    { label: "Formations", value: stats?.trainingsCount, icon: GraduationCap, accent: "#2557eb" },
    { label: "Participants", value: stats?.participantsCount, icon: Users, accent: "#0f9d6e" },
    { label: "Attestations", value: stats?.certificatesCount, icon: Award, accent: "#d97706" },
    { label: "Téléchargements", value: stats?.totalDownloads, icon: Download, accent: "#7c3aed" },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="kicker mb-1.5">Vue d&apos;ensemble</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">
            Vos formations et attestations, en un coup d&apos;œil
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
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value ?? "—"}
            icon={card.icon}
            accent={card.accent}
          />
        ))}
      </div>

      <Card className="relative mt-8 overflow-hidden">
        <div className="absolute inset-0 bg-aurora opacity-[0.04]" />
        <CardBody className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Commencer</h2>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Créez une formation, ajoutez des participants, et TUVA génère
              automatiquement leurs attestations téléchargeables — avec la
              couleur de votre choix.
            </p>
          </div>
          <Link href="/admin/trainings">
            <Button variant="secondary">
              Voir les formations
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
