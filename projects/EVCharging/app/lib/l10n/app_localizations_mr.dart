// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Marathi (`mr`).
class AppLocalizationsMr extends AppLocalizations {
  AppLocalizationsMr([String locale = 'mr']) : super(locale);

  @override
  String get loginSubtitle =>
      'तुमचे खाते सुरक्षित ठेवण्यासाठी आम्ही तुम्हाला एक कोड पाठवू.';

  @override
  String get phoneLabel => 'मोबाइल नंबर';

  @override
  String get sendCode => 'कोड पाठवा';

  @override
  String get enterCodeTitle => 'कोड टाका';

  @override
  String sentTo(String phone) {
    return 'पाठवला: $phone';
  }

  @override
  String get verifyCode => 'पडताळा';

  @override
  String resendIn(int seconds) {
    return '$seconds सेकंदांनी पुन्हा पाठवा';
  }

  @override
  String get languageLabel => 'भाषा';

  @override
  String get errWrongCode => 'कोड बरोबर नाही. पुन्हा प्रयत्न करा.';

  @override
  String get errTooManyAttempts =>
      'चुकीचे कोड खूप वेळा टाकले गेले. नवीन कोड मागवा.';

  @override
  String get errExpired => 'हा कोड कालबाह्य झाला आहे. नवीन कोड मागवा.';

  @override
  String errRateLimited(int seconds) {
    return 'खूप विनंत्या झाल्या. $seconds सेकंदांनी पुन्हा प्रयत्न करा.';
  }

  @override
  String get errSmsUnavailable => 'कोड पाठवता आला नाही. पुन्हा प्रयत्न करा.';

  @override
  String get errInvalidPhone => 'योग्य मोबाइल नंबर टाका.';

  @override
  String get errNetwork => 'इंटरनेट जोडणी नाही. तपासून पुन्हा प्रयत्न करा.';

  @override
  String get consentTitle => 'तुमची गोपनीयता';

  @override
  String get acceptTerms => 'मी सेवा अटी स्वीकारतो/स्वीकारते';

  @override
  String get marketingOffers => 'मला ऑफर पाठवा (ऐच्छिक)';

  @override
  String get consentNote =>
      'तुम्ही हे पर्याय नंतर प्रोफाइलमध्ये बदलू शकता. तुमचा डेटा भारतात साठवला जातो.';

  @override
  String get continueButton => 'पुढे जा';

  @override
  String get homeTitle => 'चार्जर शोधा';

  @override
  String get homeComingSoon => 'चार्जर नकाशा लवकरच येत आहे.';

  @override
  String get backLabel => 'मागे';
}
