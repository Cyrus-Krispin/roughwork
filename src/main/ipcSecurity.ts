type IpcSenderEvent = {
  sender: { id: number; mainFrame: unknown };
  senderFrame: { url: string } | null;
};

export function isSameRendererLocation(
  actualLocation: string,
  expectedLocation: string,
): boolean {
  try {
    const actual = new URL(actualLocation);
    const expected = new URL(expectedLocation);
    return (
      actual.protocol === expected.protocol &&
      actual.host === expected.host &&
      decodeURIComponent(actual.pathname) ===
        decodeURIComponent(expected.pathname) &&
      actual.search === expected.search &&
      actual.hash === expected.hash
    );
  } catch {
    return false;
  }
}

export function isTrustedIpcSender(
  event: IpcSenderEvent,
  trustedRendererIds: ReadonlySet<number>,
  expectedLocation: string,
): boolean {
  return (
    trustedRendererIds.has(event.sender.id) &&
    event.senderFrame === event.sender.mainFrame &&
    event.senderFrame !== null &&
    isSameRendererLocation(event.senderFrame.url, expectedLocation)
  );
}

export function selectDevelopmentEnvironmentKey(
  isPackaged: boolean,
  environmentKey: string | undefined,
): string {
  return isPackaged ? '' : (environmentKey ?? '');
}
