export type Training = {
  id: string;
  title: string;
  description: string | null;
  organizer: string;
  trainer: string;
  trainer_signature_url: string | null;
  organizer_logo_url: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  accent_color: string;
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  training_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export type Certificate = {
  id: string;
  participant_id: string;
  certificate_number: string;
  verification_code: string;
  pdf_url: string | null;
  download_count: number;
  created_at: string;
};

export type CertificateDetails = {
  certificate_id: string;
  certificate_number: string;
  verification_code: string;
  pdf_url: string | null;
  download_count: number;
  issued_at: string;
  participant_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  training_id: string;
  training_title: string;
  training_description: string | null;
  organizer: string;
  trainer: string;
  trainer_signature_url: string | null;
  organizer_logo_url: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  accent_color: string;
};

export type DashboardStats = {
  trainingsCount: number;
  participantsCount: number;
  certificatesCount: number;
  totalDownloads: number;
};
