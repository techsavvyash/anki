import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface TopBarProps {
  title?: string;
  showBackButton?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function TopBar({ title, showBackButton = false, action }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left section */}
        <div className="flex items-center min-w-0">
          {showBackButton ? (
            <button
              onClick={() => navigate(-1)}
              className="mr-3 -ml-2 p-2 text-primary-600 hover:bg-gray-100 rounded-lg active:scale-95 transition-all tap-highlight-transparent"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : null}
          <h1 className={clsx(
            'font-bold text-gray-900 truncate',
            title ? 'text-lg' : 'text-xl'
          )}>
            {title || 'Anki Web'}
          </h1>
        </div>

        {/* Right section */}
        {action && (
          <button
            onClick={action.onClick}
            className="ml-4 text-primary-600 font-medium hover:text-primary-700 active:scale-95 transition-all tap-highlight-transparent"
          >
            {action.label}
          </button>
        )}
      </div>
    </header>
  );
}
