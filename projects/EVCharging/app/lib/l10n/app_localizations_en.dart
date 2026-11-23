// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get loginSubtitle =>
      'We\'ll send you a code to keep your account secure.';

  @override
  String get phoneLabel => 'Mobile number';

  @override
  String get sendCode => 'Send code';

  @override
  String get enterCodeTitle => 'Enter code';

  @override
  String sentTo(String phone) {
    return 'Sent to $phone';
  }

  @override
  String get verifyCode => 'Verify';

  @override
  String resendIn(int seconds) {
    return 'Resend in $seconds s';
  }

  @override
  String get languageLabel => 'Language';

  @override
  String get errWrongCode => 'That code is not right. Try again.';

  @override
  String get errTooManyAttempts => 'Too many wrong codes. Request a new code.';

  @override
  String get errExpired => 'This code has expired. Request a new code.';

  @override
  String errRateLimited(int seconds) {
    return 'Too many requests. Try again in $seconds seconds.';
  }

  @override
  String get errSmsUnavailable =>
      'We could not send the code. Please try again.';

  @override
  String get errInvalidPhone => 'Enter a valid mobile number.';

  @override
  String get errNetwork => 'No connection. Check your internet and try again.';

  @override
  String get consentTitle => 'Your privacy';

  @override
  String get acceptTerms => 'I accept the Terms of Service';

  @override
  String get marketingOffers => 'Send me offers (optional)';

  @override
  String get consentNote =>
      'You can change these later in your profile. Your data is stored in India.';

  @override
  String get continueButton => 'Continue';

  @override
  String get homeTitle => 'Find a charger';

  @override
  String get homeComingSoon => 'Charger map coming soon.';

  @override
  String get backLabel => 'Back';
}
