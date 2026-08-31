export type LearningErrorCode =
  | 'invalid_request'
  | 'not_configured'
  | 'credential_failed'
  | 'invalid_credential'
  | 'provider_failed';

export class LearningFailure extends Error {
  readonly publicCode: LearningErrorCode;
  readonly publicMessage: string;

  constructor(code: LearningErrorCode, message: string, publicMessage: string) {
    super(message);
    this.name = 'LearningFailure';
    this.publicCode = code;
    this.publicMessage = publicMessage;
  }
}
