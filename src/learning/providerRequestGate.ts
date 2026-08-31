export class ProviderRequestGate {
  private pending = false;

  async run(work: () => Promise<void>): Promise<boolean> {
    if (this.pending) return false;

    this.pending = true;
    try {
      await work();
      return true;
    } finally {
      this.pending = false;
    }
  }
}
