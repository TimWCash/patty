import { PattyMark } from "@/components/Logo";
import { authEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid_state: "Sign-in session expired or was tampered with. Please try again.",
  token_exchange: "Microsoft rejected the sign-in. Check the app registration and client secret.",
  access_denied: "Sign-in was cancelled or access was denied.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signed_out?: string }>;
}) {
  const { error, signed_out } = await searchParams;
  const enabled = authEnabled();

  return (
    <div className="signin-wrap">
      <div className="signin-card">
        <div className="signin-brand">
          <PattyMark size={40} />
          <div>
            <div className="signin-title">Patty</div>
            <div className="signin-sub">by Service Physics</div>
          </div>
        </div>

        <h1 className="signin-h1">Sign in to your client hub</h1>
        <p className="signin-lead">Use your Service Physics Microsoft 365 account to continue.</p>

        {signed_out && <div className="signin-note">You&apos;ve been signed out.</div>}
        {error && <div className="signin-error">{ERRORS[error] ?? "Sign-in failed. Please try again."}</div>}

        {enabled ? (
          <a className="ms-button" href="/api/auth/login">
            <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </a>
        ) : (
          <div className="signin-note">
            Microsoft Entra ID is not configured yet. Add <code>AZURE_AD_TENANT_ID</code>,{" "}
            <code>AZURE_AD_CLIENT_ID</code>, and <code>AZURE_AD_CLIENT_SECRET</code> to{" "}
            <code>.env.local</code> to enable sign-in. Until then the hub is open for preview.
          </div>
        )}

        <div className="signin-foot">Secured by Microsoft Entra ID · Service Physics</div>
      </div>
    </div>
  );
}
