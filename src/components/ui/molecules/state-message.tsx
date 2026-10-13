import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "../atoms/button";

interface StateMessageProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function StateMessage({ icon, title, description, action }: StateMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      {icon && <div className="text-ink-subtle [&>svg]:size-8">{icon}</div>}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert">
      <StateMessage
        icon={<ExclamationTriangleIcon aria-hidden="true" className="text-rose-600" />}
        title="بارگذاری انجام نشد"
        description={message}
        action={
          onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              تلاش دوباره
            </Button>
          )
        }
      />
    </div>
  );
}
