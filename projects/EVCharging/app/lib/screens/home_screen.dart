import 'package:material_ui/material_ui.dart';

import '../config/client_config.dart';
import '../l10n/app_localizations.dart';
import 'widgets.dart';

/// Placeholder until the charger map is built (later phase).
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.config});
  final ClientConfig config;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: BrandHeader(config: config)),
      body: Center(child: Text(l.homeComingSoon)),
    );
  }
}
