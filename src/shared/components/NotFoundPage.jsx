import Button from './Button';
import { NotFoundIcon } from './icons';

export default function NotFoundPage() {
  return (
    <div className="px-6 pb-[52px] pt-20 text-center text-slate-500">
      <div className="mb-2.5 flex justify-center [&>svg]:size-[34px]">
        <NotFoundIcon />
      </div>
      <div className="mb-1 text-base font-semibold text-slate-900">Page not found</div>
      <p className="mb-4 text-sm">The page you’re looking for doesn’t exist.</p>
      <Button to="/" variant="primary">
        Go to dashboard
      </Button>
    </div>
  );
}
