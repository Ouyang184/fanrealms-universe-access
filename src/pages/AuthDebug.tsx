import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const OAUTH_DEBUG_KEY = "fanrealms.oauth.debug";

export type OAuthDebugRecord = {
  // signInWithOAuth phase
  initiatedAt?: string;
  provider?: string;
  origin?: string;
  redirectTo?: string;
  signInError?: string | null;
  providerUrl?: string | null;
  // callback phase
  callbackAt?: string;
  callbackUrl?: string;
  callbackSearch?: Record<string, string>;
  callbackHash?: Record<string, string>;
  hasCode?: boolean;
  oauthError?: string | null;
  oauthErrorDescription?: string | null;
  exchangeError?: string | null;
  exchangeStatus?: number | null;
  exchangeDurationMs?: number | null;
  resultUserId?: string | null;
  resultEmail?: string | null;
};

export const recordOAuthDebug = (patch: Partial<OAuthDebugRecord>) => {
  try {
    const prev = JSON.parse(localStorage.getItem(OAUTH_DEBUG_KEY) || "{}");
    const next = { ...prev, ...patch };
    localStorage.setItem(OAUTH_DEBUG_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

const inspectPkceStorage = () => {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.includes("code-verifier") || k.includes("auth-token") || k.startsWith("sb-")) {
        const v = localStorage.getItem(k);
        out[k] = v ? `${v.substring(0, 16)}…(len=${v.length})` : "null";
      }
    }
  } catch (e: any) {
    out["__error"] = e?.message || "unknown";
  }
  return out;
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-[180px_1fr] gap-3 py-1.5 border-b border-border/40 last:border-0">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="text-sm font-mono break-all">{value ?? <span className="text-muted-foreground">—</span>}</div>
  </div>
);

const AuthDebug = () => {
  const [record, setRecord] = useState<OAuthDebugRecord>({});
  const [pkce, setPkce] = useState<Record<string, string>>({});
  const [sessionInfo, setSessionInfo] = useState<{ userId?: string; email?: string; error?: string }>({});

  const refresh = async () => {
    try {
      setRecord(JSON.parse(localStorage.getItem(OAUTH_DEBUG_KEY) || "{}"));
    } catch {
      setRecord({});
    }
    setPkce(inspectPkceStorage());
    const { data, error } = await supabase.auth.getSession();
    setSessionInfo({
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
      error: error?.message,
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const clear = () => {
    localStorage.removeItem(OAUTH_DEBUG_KEY);
    refresh();
  };

  const callbackError = record.oauthError || record.oauthErrorDescription || record.exchangeError || record.signInError;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">OAuth Debug</h1>
            <p className="text-sm text-muted-foreground">
              Inspect the most recent Supabase OAuth attempt.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh}>Refresh</Button>
            <Button variant="outline" onClick={clear}>Clear</Button>
            <Link to="/login"><Button>Back to login</Button></Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status
              {callbackError ? (
                <Badge variant="destructive">error</Badge>
              ) : record.resultUserId ? (
                <Badge>success</Badge>
              ) : record.initiatedAt ? (
                <Badge variant="secondary">in progress</Badge>
              ) : (
                <Badge variant="outline">no attempt recorded</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Last error" value={callbackError ? <span className="text-destructive">{callbackError}</span> : null} />
            <Row label="Current session user" value={sessionInfo.userId} />
            <Row label="Current session email" value={sessionInfo.email} />
            <Row label="getSession() error" value={sessionInfo.error} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>signInWithOAuth (initiation)</CardTitle></CardHeader>
          <CardContent>
            <Row label="Initiated at" value={record.initiatedAt} />
            <Row label="Provider" value={record.provider} />
            <Row label="Origin" value={record.origin} />
            <Row label="redirectTo (passed to Supabase)" value={record.redirectTo} />
            <Row label="Provider URL returned" value={record.providerUrl} />
            <Row label="signInWithOAuth error" value={record.signInError ? <span className="text-destructive">{record.signInError}</span> : null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>/auth/callback receipt</CardTitle></CardHeader>
          <CardContent>
            <Row label="Callback at" value={record.callbackAt} />
            <Row label="Callback URL" value={record.callbackUrl} />
            <Row label="Received ?code" value={record.hasCode === undefined ? null : record.hasCode ? "yes" : "no"} />
            <Row label="Provider error" value={record.oauthError ? <span className="text-destructive">{record.oauthError}</span> : null} />
            <Row label="Provider error_description" value={record.oauthErrorDescription ? <span className="text-destructive">{record.oauthErrorDescription}</span> : null} />
            <Row label="Search params" value={record.callbackSearch ? <pre className="whitespace-pre-wrap">{JSON.stringify(record.callbackSearch, null, 2)}</pre> : null} />
            <Row label="Hash params" value={record.callbackHash ? <pre className="whitespace-pre-wrap">{JSON.stringify(record.callbackHash, null, 2)}</pre> : null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>exchangeCodeForSession</CardTitle></CardHeader>
          <CardContent>
            <Row label="Duration (ms)" value={record.exchangeDurationMs} />
            <Row label="HTTP status" value={record.exchangeStatus} />
            <Row label="Error" value={record.exchangeError ? <span className="text-destructive">{record.exchangeError}</span> : null} />
            <Row label="Resulting user id" value={record.resultUserId} />
            <Row label="Resulting email" value={record.resultEmail} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Supabase localStorage keys</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(pkce).length === 0 ? (
              <p className="text-sm text-muted-foreground">No Supabase auth keys in localStorage.</p>
            ) : (
              Object.entries(pkce).map(([k, v]) => <Row key={k} label={k} value={v} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthDebug;
