
import { Link } from 'react-router-dom';

interface TermsHeaderProps {
  pendingSignupData: { email: string } | null;
  getBackLink: () => string;
  getBackText: () => string;
}

export function TermsHeader({ pendingSignupData, getBackLink, getBackText }: TermsHeaderProps) {
  return (
    <div className="mb-8">
      <Link to={getBackLink()} className="text-primary hover:underline mb-4 inline-block">
        ← {getBackText()}
      </Link>
      <h1 className="text-4xl font-bold mb-4">Terms of Service & Privacy Policy</h1>
      <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
      {pendingSignupData && (
        <div className="mt-4 p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
          <p className="text-purple-200 text-sm">
            Please review and accept our terms to complete your account creation for <strong>{pendingSignupData.email}</strong>
          </p>
          <p className="text-purple-200 text-xs mt-1">
            Note: Multiple accounts from the same location are allowed on FanRealms.
          </p>
        </div>
      )}
    </div>
  );
}
