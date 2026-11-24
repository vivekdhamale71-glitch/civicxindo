import { EmptyArt } from "./brand/Illustration";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <EmptyArt className="h-28 w-36" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {body && <p className="mt-1 max-w-[42ch] text-body">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
