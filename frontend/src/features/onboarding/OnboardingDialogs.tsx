import { Dialog } from '../../components/ui';

export function AuthGateDialog({ open, onOpenChange, onSignIn, onCreate }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: () => void;
  onCreate: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog small">
          <div className="dialog-head">
            <span className="mono">ACCOUNT REQUIRED</span>
            <Dialog.Close className="dialog-close" aria-label="Close">×</Dialog.Close>
          </div>
          <div className="dialog-body">
            <Dialog.Title className="detail-title">SAVE YOUR<br />RECORDS.</Dialog.Title>
            <p className="section-copy">
              Sign in to record progress and completions. Your records belong to your account,
              so they follow you to any device and are backed by the server.
            </p>
            <div className="actions">
              <button className="button primary" onClick={onSignIn}>SIGN IN</button>
              <button className="button" onClick={onCreate}>CREATE ACCOUNT</button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
