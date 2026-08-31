type PermissionSession = {
  setDevicePermissionHandler(handler: () => boolean): void;
  setPermissionCheckHandler(handler: () => boolean): void;
  setPermissionRequestHandler(
    handler: (
      webContents: unknown,
      permission: string,
      callback: (allowed: boolean) => void,
    ) => void,
  ): void;
};

export function denyAllRendererPermissions(session: PermissionSession): void {
  session.setDevicePermissionHandler(() => false);
  session.setPermissionCheckHandler(() => false);
  session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

const productionContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'none'",
  "connect-src 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "img-src 'self' data:",
  "media-src 'none'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'none'",
].join('; ');

export function enforceProductionContentSecurityPolicy(
  session: Pick<Session, 'webRequest'>,
  packaged: boolean,
): void {
  if (!packaged) return;

  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [productionContentSecurityPolicy],
      },
    });
  });
}
import type { Session } from 'electron';
