// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizations {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get loginSubtitle =>
      'आपका खाता सुरक्षित रखने के लिए हम आपको एक कोड भेजेंगे।';

  @override
  String get phoneLabel => 'मोबाइल नंबर';

  @override
  String get sendCode => 'कोड भेजें';

  @override
  String get enterCodeTitle => 'कोड दर्ज करें';

  @override
  String sentTo(String phone) {
    return 'भेजा गया: $phone';
  }

  @override
  String get verifyCode => 'सत्यापित करें';

  @override
  String resendIn(int seconds) {
    return '$seconds सेकंड में दोबारा भेजें';
  }

  @override
  String get languageLabel => 'भाषा';

  @override
  String get errWrongCode => 'कोड सही नहीं है। फिर से कोशिश करें।';

  @override
  String get errTooManyAttempts =>
      'गलत कोड बहुत बार दर्ज हुए। नया कोड मंगवाएँ।';

  @override
  String get errExpired => 'यह कोड समाप्त हो गया है। नया कोड मंगवाएँ।';

  @override
  String errRateLimited(int seconds) {
    return 'बहुत अधिक अनुरोध। $seconds सेकंड बाद फिर कोशिश करें।';
  }

  @override
  String get errSmsUnavailable => 'कोड नहीं भेजा जा सका। फिर से कोशिश करें।';

  @override
  String get errInvalidPhone => 'सही मोबाइल नंबर दर्ज करें।';

  @override
  String get errNetwork => 'इंटरनेट कनेक्शन नहीं है। जाँच कर फिर कोशिश करें।';

  @override
  String get consentTitle => 'आपकी गोपनीयता';

  @override
  String get acceptTerms => 'मैं सेवा की शर्तें स्वीकार करता/करती हूँ';

  @override
  String get marketingOffers => 'मुझे ऑफ़र भेजें (वैकल्पिक)';

  @override
  String get consentNote =>
      'आप ये विकल्प बाद में प्रोफ़ाइल में बदल सकते हैं। आपका डेटा भारत में संग्रहीत होता है।';

  @override
  String get continueButton => 'जारी रखें';

  @override
  String get homeTitle => 'चार्जर खोजें';

  @override
  String get homeComingSoon => 'चार्जर मानचित्र जल्द आ रहा है।';

  @override
  String get backLabel => 'वापस';
}
