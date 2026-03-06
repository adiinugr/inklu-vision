import Badge from "@/components/ui/Badge";

interface ModuleHeaderProps {
  title: string;
  description?: string | null;
  accessCode: string;
  authorName: string;
  questionCount: number;
}

export default function ModuleHeader({
  title,
  description,
  accessCode,
  authorName,
  questionCount,
}: ModuleHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="info">Kode: {accessCode}</Badge>
        <Badge variant="default">{questionCount} soal</Badge>
      </div>
      <h1 className="mb-3 text-3xl font-bold text-zinc-900">{title}</h1>
      {description && (
        <p className="mb-3 text-lg text-zinc-600">{description}</p>
      )}
      <p className="text-sm text-zinc-500">
        Dibuat oleh <span className="font-medium text-zinc-700">{authorName}</span>
      </p>
    </div>
  );
}
