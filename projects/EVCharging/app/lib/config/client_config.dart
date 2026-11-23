import 'package:material_ui/material_ui.dart';

/// One client's branding and settings, as served by GET /api/config or bundled with the app.
class ClientConfig {
  ClientConfig({
    required this.clientId,
    required this.displayName,
    required this.mark,
    required this.primaryColor,
    required this.accentColor,
    required this.languages,
    required this.defaultLanguage,
    required this.currency,
    required this.gstRate,
    required this.features,
    required this.supportEmail,
  });

  final String clientId;
  final String displayName;
  final String mark;
  final String primaryColor;
  final String accentColor;
  final List<String> languages;
  final String defaultLanguage;
  final String currency;
  final double gstRate;
  final Map<String, bool> features;
  final String supportEmail;

  factory ClientConfig.fromJson(Map<String, dynamic> j) {
    return ClientConfig(
      clientId: j['clientId'] as String,
      displayName: j['displayName'] as String,
      mark: j['mark'] as String,
      primaryColor: j['primaryColor'] as String,
      accentColor: j['accentColor'] as String,
      languages: List<String>.from(j['languages'] as List),
      defaultLanguage: j['defaultLanguage'] as String,
      currency: j['currency'] as String,
      gstRate: (j['gstRate'] as num).toDouble(),
      features: Map<String, bool>.from(j['features'] as Map),
      supportEmail: j['supportEmail'] as String,
    );
  }

  Color get primary => _hex(primaryColor);
  Color get accent => _hex(accentColor);
  List<Locale> get locales => languages.map((l) => Locale(l)).toList();

  static Color _hex(String hex) {
    final digits = hex.replaceFirst('#', '');
    return Color(int.parse('FF$digits', radix: 16));
  }
}
