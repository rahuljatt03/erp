import Button from './Button';
import { NotFoundIcon } from './icons';

export default function NotFoundPage() {
  return (
    <div className="state" style={{ paddingTop: 80 }}>
      <div className="state__icon"><NotFoundIcon /></div>
      <div className="state__title">Page not found</div>
      <p className="state__text">The page you’re looking for doesn’t exist.</p>
      <Button to="/" variant="primary">
        Go to dashboard
      </Button>
    </div>
  );
}
