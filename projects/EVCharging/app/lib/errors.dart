import 'api/auth_api.dart';
import 'l10n/app_localizations.dart';

/// Turns a server reason into text in the user's language.
String authErrorMessage(AppLocalizations l, AuthFailure e) {
  switch (e.reason) {
    case 'WRONG_CODE':
      return l.errWrongCode;
    case 'TOO_MANY_ATTEMPTS':
      return l.errTooManyAttempts;
    case 'EXPIRED':
      return l.errExpired;
    case 'RATE_LIMITED':
      return l.errRateLimited(e.retryAfterSeconds ?? 600);
    case 'INVALID_PHONE':
      return l.errInvalidPhone;
    case 'SMS_UNAVAILABLE':
      return l.errSmsUnavailable;
    default:
      return l.errNetwork;
  }
}
