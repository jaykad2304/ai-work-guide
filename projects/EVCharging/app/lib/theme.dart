import 'package:material_ui/material_ui.dart';

import 'config/client_config.dart';

ThemeData buildTheme(ClientConfig c) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: c.primary, primary: c.primary, secondary: c.accent),
  );
}
